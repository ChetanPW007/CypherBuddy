# Small JSON-file persistence used when MongoDB is not configured, so accounts and scan history survive a
# restart of the backend. With MONGODB_URI set, MongoDB remains the primary store and these files are not needed.
#
# Files live in DATA_DIR (default: backend/data, git-ignored). On hosts with an ephemeral disk (Render free tier)
# the files are lost on redeploy: set MONGODB_URI there for data that must last.

import json
import os
import secrets
import tempfile
from typing import Any, Dict, List

DATA_DIR = os.getenv("DATA_DIR", "").strip() or os.path.join(os.path.dirname(__file__), "data")


def _path(name: str) -> str:
    return os.path.join(DATA_DIR, name)


def load_json(name: str, default: Any) -> Any:
    try:
        with open(_path(name), "r", encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return default


def save_json(name: str, data: Any) -> bool:
    """Atomic write (temp file + rename) so a crash mid-write cannot corrupt the file."""
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        fd, tmp = tempfile.mkstemp(dir=DATA_DIR, suffix=".tmp")
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(data, fh, default=str)
        os.replace(tmp, _path(name))
        return True
    except OSError:
        return False


def stable_secret(name: str = "jwt_secret.txt") -> str:
    """A random secret created once and reused, so logins survive restarts when JWT_SECRET is not set."""
    try:
        with open(_path(name), "r", encoding="utf-8") as fh:
            value = fh.read().strip()
            if len(value) >= 32:
                return value
    except OSError:
        pass
    value = secrets.token_urlsafe(64)
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        fd = os.open(_path(name), os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            fh.write(value)
    except OSError:
        pass
    return value


def unique_records(users: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    """USERS_DB maps both email and phone to one record; keep each account once."""
    seen, out = set(), []
    for rec in users.values():
        rid = rec.get("id")
        if rid and rid not in seen:
            seen.add(rid)
            out.append(rec)
    return out
