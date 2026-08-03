"""Backend tests for HyperArcade leaderboard API"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://pixel-arena-60.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

VALID_GAMES = ["dontTouchRed", "towerBloxx", "matiks", "reflex"]


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# ---------- Root ----------
def test_root(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("message") == "HyperArcade API online"


# ---------- POST /api/leaderboard valid submissions ----------
@pytest.mark.parametrize("game,display", [
    ("dontTouchRed", "15.30s"),
    ("towerBloxx", "12 pts"),
    ("matiks", "45 pts"),
    ("reflex", "212ms"),
])
def test_submit_valid(s, game, display):
    payload = {"game": game, "player": "TEST_bot", "score": 123.45, "display": display}
    r = s.post(f"{API}/leaderboard", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "id" in data and isinstance(data["id"], str)
    assert "created_at" in data
    assert data["game"] == game
    assert data["player"] == "TEST_bot"
    assert data["display"] == display

    # verify persisted
    r2 = s.get(f"{API}/leaderboard/{game}", params={"limit": 50})
    assert r2.status_code == 200
    ids = [x["id"] for x in r2.json()]
    assert data["id"] in ids


# ---------- Invalid game ----------
def test_submit_invalid_game(s):
    r = s.post(f"{API}/leaderboard", json={"game": "chess", "player": "x", "score": 1})
    assert 400 <= r.status_code < 500


# ---------- Long name truncation ----------
def test_long_name_truncated(s):
    long_name = "A" * 40
    r = s.post(f"{API}/leaderboard", json={"game": "matiks", "player": long_name, "score": 1, "display": "1 pts"})
    # Spec requires truncation to 20 chars (in response). Current implementation uses Field(max_length=20) which rejects.
    assert r.status_code == 200, f"Expected 200 (truncation), got {r.status_code}: {r.text}"
    assert len(r.json()["player"]) == 20


# ---------- Empty / whitespace name -> Anon ----------
def test_whitespace_name_defaults_anon(s):
    r = s.post(f"{API}/leaderboard", json={"game": "matiks", "player": "   ", "score": 1, "display": "1 pts"})
    assert r.status_code == 200, f"Expected 200 (defaults to Anon), got {r.status_code}: {r.text}"
    assert r.json()["player"] == "Anon"


def test_empty_name_defaults_anon(s):
    r = s.post(f"{API}/leaderboard", json={"game": "matiks", "player": "", "score": 1, "display": "1 pts"})
    assert r.status_code == 200, f"Expected 200 (defaults to Anon), got {r.status_code}: {r.text}"
    assert r.json()["player"] == "Anon"


# ---------- GET sort + limits ----------
def test_get_leaderboard_sorted_desc(s):
    # Submit varied scores
    for sc in [10, 500, 250, 999, 50]:
        s.post(f"{API}/leaderboard", json={"game": "towerBloxx", "player": "TEST_sort", "score": sc, "display": f"{sc} pts"})
    r = s.get(f"{API}/leaderboard/towerBloxx", params={"limit": 10})
    assert r.status_code == 200
    scores = [x["score"] for x in r.json()]
    assert scores == sorted(scores, reverse=True)


def test_get_limit_default_is_10(s):
    r = s.get(f"{API}/leaderboard/towerBloxx")
    assert r.status_code == 200
    assert len(r.json()) <= 10


def test_get_limit_max_50(s):
    r = s.get(f"{API}/leaderboard/towerBloxx", params={"limit": 50})
    assert r.status_code == 200
    assert len(r.json()) <= 50
    # limit > 50 should error
    r2 = s.get(f"{API}/leaderboard/towerBloxx", params={"limit": 51})
    assert r2.status_code == 422


# ---------- Aggregate ----------
def test_aggregate_all_games(s):
    r = s.get(f"{API}/leaderboard")
    assert r.status_code == 200
    data = r.json()
    for g in VALID_GAMES:
        assert g in data, f"Missing key {g} in aggregate"
        assert isinstance(data[g], list)
