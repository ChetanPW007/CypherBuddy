"""Persistence helpers: data written before a 'restart' is there afterwards, and the JWT secret is stable."""
import importlib
import persist


def _fresh(tmp_path, monkeypatch):
    monkeypatch.setenv("DATA_DIR", str(tmp_path))
    return importlib.reload(persist)


def test_users_survive_restart(tmp_path, monkeypatch):
    p = _fresh(tmp_path, monkeypatch)
    rec = {"id": "USR-1", "email": "a@b.co", "phone": "+911234567890", "passwordHash": "x"}
    users = {rec["email"]: rec, rec["phone"]: rec}
    assert len(p.unique_records(users)) == 1          # email and phone point to ONE account
    assert p.save_json("users.json", p.unique_records(users))
    p2 = _fresh(tmp_path, monkeypatch)                # new process, same disk
    assert p2.load_json("users.json", []) == [rec]


def test_missing_or_corrupt_file_gives_default(tmp_path, monkeypatch):
    p = _fresh(tmp_path, monkeypatch)
    assert p.load_json("nope.json", []) == []
    (tmp_path / "bad.json").write_text("{not json")
    assert p.load_json("bad.json", {"k": 1}) == {"k": 1}


def test_jwt_secret_is_stable(tmp_path, monkeypatch):
    p = _fresh(tmp_path, monkeypatch)
    first = p.stable_secret()
    assert len(first) >= 32
    assert _fresh(tmp_path, monkeypatch).stable_secret() == first
