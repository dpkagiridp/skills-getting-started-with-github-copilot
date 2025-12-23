from fastapi.testclient import TestClient
from app import app, activities

client = TestClient(app)

def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert "participants" in data["Chess Club"]

def test_signup_success():
    initial_count = len(activities["Chess Club"]["participants"])
    response = client.post("/activities/Chess%20Club/signup?email=newstudent@example.com")
    assert response.status_code == 200
    resp_data = response.json()
    assert "Signed up" in resp_data["message"]
    # Check added
    assert len(activities["Chess Club"]["participants"]) == initial_count + 1
    assert "newstudent@example.com" in activities["Chess Club"]["participants"]

def test_signup_duplicate():
    # First signup
    client.post("/activities/Chess%20Club/signup?email=dupe@example.com")
    # Second
    response = client.post("/activities/Chess%20Club/signup?email=dupe@example.com")
    assert response.status_code == 400
    assert "already signed up" in response.json()["detail"]

def test_signup_activity_not_found():
    response = client.post("/activities/Invalid%20Activity/signup?email=test@example.com")
    assert response.status_code == 404
    assert "Activity not found" in response.json()["detail"]

def test_delete_success():
    # Signup first
    client.post("/activities/Programming%20Class/signup?email=deletetest@example.com")
    initial_count = len(activities["Programming Class"]["participants"])
    response = client.delete("/activities/Programming%20Class/participants?email=deletetest@example.com")
    assert response.status_code == 200
    resp_data = response.json()
    assert "Unregistered" in resp_data["message"]
    # Check removed
    assert len(activities["Programming Class"]["participants"]) == initial_count - 1
    assert "deletetest@example.com" not in activities["Programming Class"]["participants"]

def test_delete_not_signed():
    response = client.delete("/activities/Chess%20Club/participants?email=notsigned@example.com")
    assert response.status_code == 400
    assert "not signed up" in response.json()["detail"]

def test_delete_activity_not_found():
    response = client.delete("/activities/Invalid%20Activity/participants?email=test@example.com")
    assert response.status_code == 404
    assert "Activity not found" in response.json()["detail"]

def test_root_redirect():
    response = client.get("/", follow_redirects=False)
    assert response.status_code == 307  # Redirect
    assert "/static/index.html" in response.headers["location"]