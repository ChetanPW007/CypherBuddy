"""
Regression tests for the URL engine (stdlib + pytest only; no FastAPI needed).

    python -m pytest backend/test_url_engine.py -q
"""
import json
import os
import sys

import pytest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import security_engine as se  # noqa: E402

with open(os.path.join(HERE, "..", "shared", "url_test_corpus.json"), encoding="utf-8") as fh:
    CASES = json.load(fh)["cases"]


def _action(result):
    return {"SAFE": "allow", "SUSPICIOUS": "warn", "DANGEROUS": "block"}[result["status"]]


@pytest.mark.parametrize("case", CASES, ids=[c["url"][:60] for c in CASES])
def test_corpus_verdict(case):
    result = se.analyze_url_hardened(case["url"], expand=False)
    action = _action(result)
    if case["expect"] == "warn":
        assert action in ("warn", "block"), (case["url"], result["riskScore"], result["findings"])
    else:
        assert action == case["expect"], (case["url"], result["riskScore"], [f["title"] for f in result["findings"]])


def test_status_and_score_agree_at_every_threshold():
    """The old endpoint used 30 while the engine used 35. There is now exactly one rule."""
    assert se.status_for(34) == "SAFE"
    assert se.status_for(35) == "SUSPICIOUS"
    assert se.status_for(69) == "SUSPICIOUS"
    assert se.status_for(70) == "DANGEROUS"


def test_plain_http_without_other_signals_is_not_blocked():
    r = se.analyze_url_hardened("http://example.com/", expand=False)
    assert r["status"] == "SAFE"
    assert any(f["title"].startswith("Unencrypted") for f in r["findings"])


def test_http_plus_login_path_is_flagged():
    r = se.analyze_url_hardened("http://some-unknown-site.in/login/verify", expand=False)
    assert r["status"] in ("SUSPICIOUS", "DANGEROUS")


def test_short_link_expansion_uses_final_destination(monkeypatch):
    monkeypatch.setattr(
        se, "expand_short_url",
        lambda url, **kw: ("https://paypal.com.account-verify.xyz/", [url, "https://paypal.com.account-verify.xyz/"], True),
    )
    r = se.analyze_url_hardened("https://bit.ly/abc123")
    assert r["status"] == "DANGEROUS"
    assert r["finalUrl"] == "https://paypal.com.account-verify.xyz/"
    assert r["findings"][0]["title"] == "Short Link Expanded"


def test_short_link_to_known_good_destination_is_safe(monkeypatch):
    monkeypatch.setattr(
        se, "expand_short_url",
        lambda url, **kw: ("https://www.amazon.in/dp/B0CX23V2ZK", [url, "https://www.amazon.in/dp/B0CX23V2ZK"], True),
    )
    r = se.analyze_url_hardened("https://amzn.to/xyz")  # amzn.to is official, not expanded
    assert r["status"] == "SAFE"
    r = se.analyze_url_hardened("https://bit.ly/abc")
    assert r["status"] == "SAFE"
    assert r["riskScore"] >= 15


def test_unresolvable_short_link_is_warned_not_trusted(monkeypatch):
    monkeypatch.setattr(se, "expand_short_url", lambda url, **kw: (url, [url], False))
    r = se.analyze_url_hardened("https://bit.ly/abc")
    assert r["status"] == "SUSPICIOUS"


def test_expansion_stops_at_ssrf_target(monkeypatch):
    """A shortener that redirects to a private address must never be contacted."""
    calls = []

    class FakeOpener:
        def open(self, req, timeout=None):
            calls.append(req.full_url)
            import urllib.error, email.message
            h = email.message.Message()
            h["Location"] = "http://169.254.169.254/latest/meta-data/"
            raise urllib.error.HTTPError(req.full_url, 302, "Found", h, None)

    monkeypatch.setattr(se.urllib.request, "build_opener", lambda *a, **k: FakeOpener())
    monkeypatch.setattr(se.socket, "getaddrinfo", lambda *a, **k: [(2, 1, 6, "", ("93.184.216.34", 0))])
    final, chain, resolved = se.expand_short_url("https://bit.ly/x")
    assert calls == ["https://bit.ly/x"]            # only the shortener was contacted
    assert final == "http://169.254.169.254/latest/meta-data/"
    assert resolved is True                          # reached a non-shortener, and was NOT requested


def test_scheme_less_input_is_scanned_not_rejected():
    r = se.analyze_url_hardened("example.com", expand=False)
    assert r["status"] == "SAFE"
    assert r["target"] == "https://example.com"


def test_dangerous_pseudo_schemes_are_blocked():
    for u in ("javascript:alert(1)", "data:text/html,<script>1</script>", "file:///etc/passwd"):
        assert se.analyze_url_hardened(u, expand=False)["status"] == "DANGEROUS"


def test_ipv6_loopback_and_mapped_are_internal():
    assert se.is_ssrf_safe_url("http://[::1]/", resolve=False)[0] is False
    assert se.is_ssrf_safe_url("http://[::ffff:127.0.0.1]/", resolve=False)[0] is False
    assert se.is_ssrf_safe_url("http://[fd00::1]/", resolve=False)[0] is False


def test_registrable_domain():
    assert se.registrable_domain("www.sbi.co.in") == "sbi.co.in"
    assert se.registrable_domain("netbanking.hdfcbank.com") == "hdfcbank.com"
    assert se.registrable_domain("evil.github.io") == "evil.github.io"
    assert se.registrable_domain("a.b.c.example.com") == "example.com"


def test_short_brands_do_not_match_inside_words():
    assert se._brand_hits("groups.google.com") == ["google"]  # google (len>=6) only; never 'ups'
    assert "ups" not in se._brand_hits("cups-and-saucers.com")
    assert "steam" not in se._brand_hits("steampowered.com")
    assert "hdfc" in se._brand_hits("hdfcbank-kyc.xyz")
