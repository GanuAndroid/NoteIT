 
        const notesList = document.getElementById('notesList');
        const modal = document.getElementById('noteModal');
        const profileIcon = document.getElementById("profileIcon");
        const profileDropdown = document.getElementById("profileDropdown");
        const userNameDiv = document.getElementById("userName");
        //View Note 
        const viewNoteModal = document.getElementById("viewNoteModal");
        const viewNoteTitle = document.getElementById("viewNoteTitle");
        const viewNoteContent = document.getElementById("viewNoteContent");
        const viewNoteDate = document.getElementById("viewNoteDate");
        //Edit Note

        const noteModal = document.getElementById("noteModal");
        const modalTitle = document.getElementById("modalTitle");
        const hiddenNoteId = document.getElementById("noteId");

        const noteTitleInput = document.getElementById("noteTitle");
        const noteBodyInput = document.getElementById("noteBody");
        const modalSaveBtn = document.getElementById("modalSaveBtn");
        //Toggle buttong
       // const notesContainer = document.getElementById("notesList");
        const toggleViewBtn = document.getElementById("toggleViewBtn");

        let currentView = localStorage.getItem("notesView") || "grid";
        applyView(currentView);

        toggleViewBtn.addEventListener("click", () => {
        currentView = currentView === "grid" ? "list" : "grid";
        localStorage.setItem("notesView", currentView);
        applyView(currentView);
        });

        let currentNotes = [];

        // Set logged-in user's name
        const user = JSON.parse(localStorage.getItem("user"));
        if (user) {
            userNameDiv.textContent = user.name;
        } else {
            logout()
        }

        function applyView(view) {
        notesList.classList.remove("grid-view", "list-view");

        if (view === "grid") {
        notesList.classList.add("grid-view");
        toggleViewBtn.textContent = "📋 List View";
         } else {
        notesList.classList.add("list-view");
        toggleViewBtn.textContent = "🔳 Grid View";
        }
        }


        const API = "http://103.212.135.69:5000/api/notes";

        async function saveNote() {
            const title = noteTitleInput.value
            const content = noteBodyInput.value
            if (!noteTitleInput.value || !noteBodyInput.value) {
                alert("Please fill out title and content.");
                return;
            }
            const userDataString = localStorage.getItem("user");
            const user = JSON.parse(userDataString);
            const newNote = {
                userId: user.id, title, content, date: new Date().toISOString()
            };

            try {
                const res = await fetch(API + "", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newNote),
                });
                const data = await res.json();
                if (res.ok) {
                    // Server sends back { message, note }
                    renderNotes();
                    closeModal();
                } else {
                    alert(data.error || "Error saving note");
                }
            } catch (error) {
                console.error("Error saving note:", error);
                alert("Failed to connect to the server");
            }
            renderNotes();
            closeModal();
        }

        async function updateNote(noteIdString) {
            const noteId = noteIdString
            const title = noteTitleInput.value
            const content = noteBodyInput.value
            const user = JSON.parse(localStorage.getItem("user"));

            try {
                const response = await fetch(`${API}/${user.id}/${noteIdString}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ title, content }),
                });

                const data = await response.json();
                if (response.ok) {
                    // Server sends back { message, note }
                    renderNotes();
                    closeModal();
                } else {
                    alert("❌ " + data.error);
                }
            } catch (error) {
                console.error("Error updating note:", error);
                alert("Failed to update note.");
            }
        }

        async function deleteNote(noteIdString) {
            const noteId = noteIdString
            try {
                const response = await fetch(`${API}/${noteIdString}`, {
                    method: "DELETE",
                });

                const data = await response.json();
                if (response.ok) {
                    // Server sends back { message, note }
                    alert(data.message);

                    renderNotes();
                    closeModal();
                } else {
                    alert("❌ " + data.error);
                }
            } catch (error) {
                console.error("Error Deleting note:", error);
                alert("Failed to Delete note.");
            }

        }

        // Toggle dropdown on click
        profileIcon.addEventListener("click", () => {
            profileDropdown.style.display = profileDropdown.style.display === "block" ? "none" : "block";
        });

        // Close dropdown if clicked outside
        document.addEventListener("click", (e) => {
            if (!profileIcon.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.style.display = "none";
            }
        });

        function logout() {
            localStorage.removeItem("user");
            window.location.href = "index.html";
        }
        function openViewModal(note) {
            viewNoteTitle.textContent = note.title;
            viewNoteContent.textContent = note.content;
            viewNoteDate.textContent = new Date(note.date).toLocaleString();
            viewNoteModal.style.display = "flex";
        }
        modalSaveBtn.onclick = async function () {
            const title = noteTitleInput.value;
            const content = noteBodyInput.value;
            if (!title || !content) {
                alert("Title and content cannot be empty!");
                return;
            }

            if (modalSaveBtn.textContent === "Save Note") {
                // Call saveNote() 
                await saveNote();
            } else if (modalSaveBtn.textContent === "Delete Note") {
                await deleteNote(hiddenNoteId.value)
            } else {
                //  For edit/update case
                await updateNote(hiddenNoteId.value);
            }
        }

        notesList.addEventListener("click", (event) => {
    const noteEl = event.target.closest(".note");
    if (!noteEl) return;

    const noteId = noteEl.dataset.id;
    const note = currentNotes.find(n => n._id === noteId);
    if (!note) return;

    // ✏️ Edit
    if (event.target.classList.contains("edit-btn")) {
        event.stopPropagation();
        editNoteDialog(note);
        return;
    }

    // 🗑️ Delete
    if (event.target.classList.contains("delete-btn")) {
        event.stopPropagation();
        deleteNoteDialog(note);
        return;
    }

    // 👁 View (click anywhere else)
    openViewModal(note);
});


        function createNewNoteDialog() {
            modalTitle.textContent = "Create New Note";
            modalSaveBtn.textContent = "Save Note";
            noteTitleInput.value = "";
            noteBodyInput.value = "";
            hiddenNoteId.value = null;
            noteTitleInput.disabled = false;
            noteBodyInput.disabled = false;
            noteModal.style.display = "flex";
        }
        function editNoteDialog(note) {
            modalTitle.textContent = "Update Note";
            modalSaveBtn.textContent = "Update Note";
            noteTitleInput.value = note.title;
            noteBodyInput.value = note.content;
            hiddenNoteId.value = note._id;
            noteTitleInput.disabled = false;
            noteBodyInput.disabled = false;
            noteModal.style.display = "flex";
        }
        function deleteNoteDialog(note) {
            modalTitle.textContent = "Are you sure you want to delete this note?";
            modalSaveBtn.textContent = "Delete Note";
            noteTitleInput.value = note.title;
            noteTitleInput.disabled = true;
            noteBodyInput.value = note.content;
            noteBodyInput.disabled = true;
            hiddenNoteId.value = note._id;
            noteModal.style.display = "flex";
        }


    function renderNotes() {
    const user = JSON.parse(localStorage.getItem("user"));

    fetch(`${API}/user/${user.id}`)
        .then(res => {
            if (!res.ok) throw new Error("Failed to fetch notes");
            return res.json();
        })
        .then(notes => {
            currentNotes = notes; // ✅ store notes globally

            if (!notes.length) {
                notesList.innerHTML =
                    `<div class="alert info">No notes found.</div>`;
                return;
            }

            notesList.innerHTML = notes.map(note => `
                <div class="note" data-id="${note._id}">
                    <div class="note-content">
                        <h3>${note.title}</h3>
                        <small>
                            ${note.content.substring(0, 80)}
                            ${note.content.length > 80 ? "..." : ""}
                        </small>
                    </div>

                    <div class="note-footer">
                        <small>${new Date(note.date).toDateString()}</small>
                        <span class="note-actions">
                            <i class="edit-btn">✏️</i>
                            <i class="delete-btn">🗑️</i>
                        </span>
                    </div>
                </div>
            `).join("");
        })
        .catch(err => {
            console.error(err);
            notesList.innerHTML =
                `<div class="alert error">Failed to load notes</div>`;
        });
        }




        function closeViewModal() {
            viewNoteModal.style.display = "none";
        }

        function closeModal() {
            modal.style.display = "none";
            document.getElementById("noteTitle").value = "";
            document.getElementById("noteBody").value = "";
        }

        renderNotes();

