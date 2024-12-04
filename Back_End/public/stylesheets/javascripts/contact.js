document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contact-form");
    const successMessage = document.getElementById("success-message");

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        fetch(form.action, {
            method: "POST",
            body: new FormData(form),
            headers: {
                Accept: "application/json",
            },
        })
            .then((response) => {
                if (response.ok) {
                    form.reset(); 
                    successMessage.textContent = "Your message has been submitted successfully!";
                    successMessage.classList.remove("hidden");
                } else {
                    successMessage.textContent = "Something went wrong. Please try again later.";
                    successMessage.classList.add("error");
                    successMessage.classList.remove("hidden");
                }
            })
            .catch(() => {
                successMessage.textContent = "Network error. Please check your connection.";
                successMessage.classList.add("error");
                successMessage.classList.remove("hidden");
            });
    });
});
