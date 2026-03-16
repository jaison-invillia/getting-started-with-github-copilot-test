import copy
from urllib.parse import quote

import pytest
from fastapi.testclient import TestClient

from src.app import app, activities


@pytest.fixture(autouse=True)
def reset_activities_state():
    snapshot = copy.deepcopy(activities)
    yield
    activities.clear()
    activities.update(snapshot)


@pytest.fixture
def client():
    return TestClient(app)


def test_root_redirects_to_static_index(client):
    response = client.get("/", follow_redirects=False)

    assert response.status_code in (302, 307)
    assert response.headers["location"] == "/static/index.html"


def test_get_activities_returns_all_activities(client):
    response = client.get("/activities")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert "participants" in data["Chess Club"]


def test_signup_for_activity_success(client):
    activity_name = "Chess Club"
    email = "newstudent@mergington.edu"
    encoded_name = quote(activity_name, safe="")

    response = client.post(f"/activities/{encoded_name}/signup", params={"email": email})

    assert response.status_code == 200
    assert response.json() == {"message": f"Signed up {email} for {activity_name}"}
    assert email in activities[activity_name]["participants"]


def test_signup_for_activity_fails_if_already_signed_up(client):
    activity_name = "Chess Club"
    email = "michael@mergington.edu"
    encoded_name = quote(activity_name, safe="")

    response = client.post(f"/activities/{encoded_name}/signup", params={"email": email})

    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_signup_for_activity_fails_if_activity_not_found(client):
    encoded_name = quote("Unknown Club", safe="")

    response = client.post(
        f"/activities/{encoded_name}/signup",
        params={"email": "student@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_cancel_signup_success(client):
    activity_name = "Chess Club"
    email = "daniel@mergington.edu"
    encoded_name = quote(activity_name, safe="")

    response = client.delete(f"/activities/{encoded_name}/signup", params={"email": email})

    assert response.status_code == 200
    assert response.json() == {"message": f"Canceled signup of {email} for {activity_name}"}
    assert email not in activities[activity_name]["participants"]


def test_cancel_signup_fails_if_student_not_signed_up(client):
    activity_name = "Chess Club"
    email = "naoinscrito@mergington.edu"
    encoded_name = quote(activity_name, safe="")

    response = client.delete(f"/activities/{encoded_name}/signup", params={"email": email})

    assert response.status_code == 404
    assert response.json()["detail"] == "Student is not signed up for this activity"


def test_cancel_signup_fails_if_activity_not_found(client):
    encoded_name = quote("Unknown Club", safe="")

    response = client.delete(
        f"/activities/{encoded_name}/signup",
        params={"email": "student@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"
