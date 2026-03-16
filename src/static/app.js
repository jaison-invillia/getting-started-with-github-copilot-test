document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function createParticipantsMarkup(activityName, participants) {
    if (!participants.length) {
      return '<p class="participants-empty">Nenhum participante inscrito ainda.</p>';
    }

    const participantItems = participants
      .map(
        (participant) =>
          `<li class="participant-item">
            <span class="participant-email">${participant}</span>
            <button
              type="button"
              class="participant-remove-btn"
              data-activity="${activityName}"
              data-email="${participant}"
              aria-label="Cancelar inscrição de ${participant}"
              title="Cancelar inscrição"
            >&#128465;</button>
          </li>`
      )
      .join("");

    return `<ul class="participants-list">${participantItems}</ul>`;
  }

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Selecione uma atividade --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const availabilityClass = spotsLeft <= 3 ? "availability-pill availability-low" : "availability-pill";

        activityCard.innerHTML = `
          <div class="activity-card-header">
            <div>
              <h4>${name}</h4>
              <p class="activity-description">${details.description}</p>
            </div>
            <span class="${availabilityClass}">${spotsLeft} vagas</span>
          </div>
          <div class="activity-meta">
            <p><strong>Horário:</strong> ${details.schedule}</p>
            <p><strong>Inscritos:</strong> ${details.participants.length} de ${details.max_participants}</p>
          </div>
          <div class="participants-section">
            <h5>Participantes</h5>
            ${createParticipantsMarkup(name, details.participants)}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle participant unsubscribe from activity
  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".participant-remove-btn");
    if (!removeButton) {
      return;
    }

    const activity = removeButton.dataset.activity;
    const email = removeButton.dataset.email;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to cancel signup. Please try again.", "error");
      console.error("Error canceling signup:", error);
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
