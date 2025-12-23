document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageEl = document.getElementById("message");

  function showMessage(text, cls = "info") {
    messageEl.className = "message " + cls;
    messageEl.textContent = text;
  }

  function loadActivities(selected = "") {
    fetch("/activities")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load activities");
        return res.json();
      })
      .then((data) => {
        activitiesList.innerHTML = "";
        activitySelect.innerHTML = '<option value="">Select an activity</option>';
        Object.keys(data).forEach((name) => {
          const a = data[name];
          const card = document.createElement("div");
          card.className = "activity-card";
          card.innerHTML = `
            <h4>${name}</h4>
            <p>${a.description}</p>
            <p><strong>Schedule:</strong> ${a.schedule}</p>
            <div class="participants">
              <h5>Participants</h5>
              <ul></ul>
            </div>
          `;
          const ul = card.querySelector(".participants ul");
          if (Array.isArray(a.participants) && a.participants.length) {
            a.participants.forEach((p) => {
              const li = document.createElement("li");
              li.innerHTML = `${p}<span class="delete-icon" data-email="${p}" data-activity="${name}">×</span>`;
              ul.appendChild(li);
            });
          } else {
            const li = document.createElement("li");
            li.textContent = "No participants yet";
            li.className = "empty";
            ul.appendChild(li);
          }
          activitiesList.appendChild(card);

          const opt = document.createElement("option");
          opt.value = name;
          opt.textContent = name;
          activitySelect.appendChild(opt);
        });
        activitySelect.value = selected;
      })
      .catch((err) => {
        activitiesList.innerHTML = '<p class="error">Unable to load activities.</p>';
        console.error(err);
      });
  }

  // Load activities initially
  loadActivities();

  // Signup handling
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const activity = activitySelect.value;
    if (!email || !activity) return showMessage("Please enter your email and select an activity", "error");

    showMessage("Signing up...", "info");
    const url = `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`;

    fetch(url, { method: "POST" })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Signup failed");
        }
        return res.json();
      })
      .then((resp) => {
        showMessage(resp.message || "Signed up", "success");
        // reload activities to reflect changes, keep the selected activity
        loadActivities(activity);
      })
      .catch((err) => {
        showMessage(err.message || "Signup failed", "error");
      });
  });

  // Delete participant handling
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-icon")) {
      const email = e.target.dataset.email;
      const activity = e.target.dataset.activity;
      showMessage("Unregistering...", "info");
      const url = `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`;

      fetch(url, { method: "DELETE" })
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || "Unregister failed");
          }
          return res.json();
        })
        .then((resp) => {
          showMessage(resp.message || "Unregistered", "success");
          // reload activities to reflect changes, keep the selected activity
          loadActivities(activitySelect.value);
        })
        .catch((err) => {
          showMessage(err.message || "Unregister failed", "error");
        });
    }
  });
});
