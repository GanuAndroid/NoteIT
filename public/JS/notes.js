 
        const notesList = document.getElementById('notesList');
        const modal = document.getElementById('noteModal');
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
        let currentTab = localStorage.getItem("currentTab") || "notes";

        // Tab setup
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                navTabs.forEach(t => {
                    t.classList.remove('bg-primary', 'text-white', 'shadow-lg', 'shadow-primary/20', 'active');
                    t.classList.add('text-slate-600');
                    t.querySelector('.material-symbols-outlined').classList.remove('fill-[1]');
                });
                
                tab.classList.add('bg-primary', 'text-white', 'shadow-lg', 'shadow-primary/20', 'active');
                tab.classList.remove('text-slate-600');
                tab.querySelector('.material-symbols-outlined').classList.add('fill-[1]');
                
                currentTab = tab.dataset.tab;
                localStorage.setItem("currentTab", currentTab);
                
                const headerTitle = document.querySelector('h2');
                const headerP = document.querySelector('h2 + p');
                if (currentTab === 'notes') {
                    headerTitle.textContent = 'Recent Notes';
                    headerP.textContent = 'Organize your thoughts and workflows';
                } else if (currentTab === 'favorites') {
                    headerTitle.textContent = 'Favorite Notes';
                    headerP.textContent = 'Your starred thoughts and ideas';
                } else if (currentTab === 'shared') {
                    headerTitle.textContent = 'Shared Notes';
                    headerP.textContent = 'Notes shared with you or by you';
                }

                renderNotes();
            });
        });

        // Initialize display by clicking the saved tab
        const initialTab = document.querySelector(`.nav-tab[data-tab="${currentTab}"]`);
        if (initialTab) {
            initialTab.click();
        } else {
            renderNotes();
        }

        // Set logged-in user's name
        const user = JSON.parse(localStorage.getItem("data"));
        if (user) {
            if (userNameDiv) userNameDiv.textContent = user.name;
        } else {
            logout()
        }

        function applyView(view) {
        notesList.className = "";

        if (view === "grid") {
        notesList.classList.add("grid", "grid-cols-1", "md:grid-cols-2", "lg:grid-cols-3", "xl:grid-cols-4", "gap-4");
        toggleViewBtn.textContent = "📋 List View";
         } else {
        notesList.classList.add("flex", "flex-col", "gap-3");
        toggleViewBtn.textContent = "🔳 Grid View";
        }
        }


        const API = "/api/notes";

        async function saveNote() {
            const title = noteTitleInput.value
            const content = noteBodyInput.value
            if (!noteTitleInput.value || !noteBodyInput.value) {
                alert("Please fill out title and content.");
                return;
            }
            const userDataString = localStorage.getItem("data");
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
            const user = JSON.parse(localStorage.getItem("data"));

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
            const user = JSON.parse(localStorage.getItem("data"));
            try {
                const response = await fetch(`${API}/${user.id}/${noteIdString}`, {
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

        function logout() {
            localStorage.removeItem("data");
            window.location.href = "index.html";
        }
        function openViewModal(note) {
            viewNoteTitle.textContent = note.title;
            viewNoteContent.textContent = note.content;
            
            const revokeBtn = document.getElementById("viewModalRevokeBtn");
            const detailsSection = document.getElementById("viewNoteDetails");
            
            if (revokeBtn) revokeBtn.classList.add("hidden");
            if (detailsSection) detailsSection.classList.add("hidden");
            
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

        notesList.addEventListener("click", async (event) => {
    const noteEl = event.target.closest(".note");
    if (!noteEl) return;

    const noteId = noteEl.dataset.id;
    const isShared = noteEl.dataset.isShared;

    console.log("Card Clicked:", { noteId, isShared });

    let note;
    if (isShared === "true") {
        note = currentNotes.find(n => (n.shareId === noteId || n._id === noteId || String(n.shareId) === noteId));
    } else {
        note = currentNotes.find(n => (n.id === noteId || n._id === noteId || String(n.id) === noteId));
    }
    
    if (!note) {
        console.error("Note not found in local memory:", { noteId, isShared, currentCount: currentNotes.length });
        return;
    }

    // ⭐ Favorite
    if (event.target.classList.contains("fav-btn") || event.target.closest(".fav-btn")) {
        event.stopPropagation();
        await toggleFavorite(noteId);
        return;
    }

    // 🔗 Share
    if (event.target.classList.contains("share-btn") || event.target.closest(".share-btn")) {
        event.stopPropagation();
        openShareModal(noteId);
        return;
    }

    // ✏️ Edit
    if (event.target.classList.contains("edit-btn") || event.target.closest(".edit-btn")) {
        event.stopPropagation();
        editNoteDialog(note);
        return;
    }

    // 🗑️ Delete
    if (event.target.classList.contains("delete-btn") || event.target.closest(".delete-btn")) {
        event.stopPropagation();
        deleteNoteDialog(note);
        return;
    }

    // 🚫 Revoke (Shared Notes)
    if (event.target.classList.contains("revoke-btn") || event.target.closest(".revoke-btn")) {
        event.stopPropagation();
        revokeAccessDialog(note);
        return;
    }

    // 👁 View (click anywhere else)
    if (isShared === "true") {
        viewNoteTitle.textContent = note.title || 'Untitled';
        viewNoteContent.textContent = note.contentPreview || 'No preview available.';
        
        const detailsSection = document.getElementById("viewNoteDetails");
        const revokeBtn = document.getElementById("viewModalRevokeBtn");

        if (detailsSection) {
            detailsSection.classList.remove("hidden");
            // Populate Details
            document.getElementById("viewDetailCreated").textContent = note.noteCreatedAt ? new Date(note.noteCreatedAt).toLocaleString() : 'N/A';
            document.getElementById("viewDetailSharedDate").textContent = note.sharedAt ? new Date(note.sharedAt).toLocaleString() : 'N/A';
            
            document.getElementById("viewDetailSharedBy").textContent = note.sharedBy ? note.sharedBy.name : 'Unknown';
            document.getElementById("viewDetailSharedByMobile").textContent = note.sharedBy ? note.sharedBy.mobile : '';
            
            document.getElementById("viewDetailSharedTo").textContent = note.sharedTo ? note.sharedTo.name : 'Unknown';
            document.getElementById("viewDetailSharedToMobile").textContent = note.sharedTo ? note.sharedTo.mobile : '';
        }
        
        if (revokeBtn) {
            if (note.sharedType === 'shared_by_me') {
                revokeBtn.classList.remove("hidden");
                revokeBtn.onclick = (e) => {
                    e.stopPropagation();
                    revokeAccessDialog(note);
                    closeViewModal();
                };
            } else {
                revokeBtn.classList.add("hidden");
            }
        }
        
        viewNoteModal.style.display = "flex";
    } else {
        openViewModal(note);
    }
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
            hiddenNoteId.value = note.id;
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
            hiddenNoteId.value = note.id;
            noteModal.style.display = "flex";
        }


    async function toggleFavorite(noteId) {
        const user = JSON.parse(localStorage.getItem("data"));
        try {
            const res = await fetch(`${API}/${user.id}/${noteId}/favorite`, {
                method: "PATCH"
            });
            if (res.ok) {
                renderNotes();
            } else {
                alert("Failed to toggle favorite");
            }
        } catch (err) {
            console.error("Error toggling favorite:", err);
        }
    }

    const shareModal = document.getElementById("shareModal");
    const shareNoteIdInput = document.getElementById("shareNoteId");
    const shareToInput = document.getElementById("shareToInput");

    function openShareModal(noteId) {
        if (!noteId || noteId === "undefined") {
            alert("Error: Note ID is missing. Please refresh the page.");
            return;
        }
        shareNoteIdInput.value = noteId;
        shareToInput.value = "";
        shareModal.style.display = "flex";
    }

    window.closeShareModal = function() {
        shareModal.style.display = "none";
    };

    async function revokeAccessDialog(item) {
        if (!confirm("Are you sure you want to revoke access? This will remove the share for all parties.")) return;
        
        const user = JSON.parse(localStorage.getItem("data") || "{}");
        // Ensure we parse ID correctly
        const ownerId = user.id || user._id || user.uid;
        const shareId = item.shareId || item._id || item.id;

        console.log("🛫 Revocation Payload:", { shareId, ownerId, item });

        if (!shareId || shareId === "undefined") {
            console.error("🛑 Revoke shareId is missing/invalid!");
            alert("Error: Share record ID is missing. Please refresh the page.");
            return;
        }

        if (!ownerId || ownerId === "undefined") {
            console.error("🛑 Revoke ownerId is missing/invalid!");
            alert("Error: User session expired. Please re-login.");
            return;
        }

        const url = `${API}/revoke-share/${shareId}/${ownerId}`;
        console.log("🔗 Revoke Fetch URL:", url);

        try {
            const res = await fetch(url, {
                method: "DELETE"
            });
            const data = await res.json();
            if (res.ok) {
                console.log("🎉 Revoke SUCCESS:", data);
                alert("Access revoked successfully");
                renderNotes();
            } else {
                console.error("🚩 Revoke FAILED:", data);
                alert(data.message || "Failed to revoke access");
            }
        } catch (err) {
            console.error("💥 Revoke ERROR (Network/Fetch):", err);
            alert("An error occurred during revocation.");
        }
    }

    async function submitShare() {
        const shareNoteIdInput = document.getElementById("shareNoteId");
        const shareToInput = document.getElementById("shareToInput");
        const shareStatus = document.getElementById("shareStatus");
        
        const noteId = shareNoteIdInput ? shareNoteIdInput.value : null;
        const identifier = shareToInput ? shareToInput.value.trim() : "";
        const user = JSON.parse(localStorage.getItem("data") || "{}");
        const ownerId = user.id || user._id;

        if (shareStatus) {
            shareStatus.className = "hidden";
        }

        const showStatus = (msg, isError = true) => {
            if (!shareStatus) { alert(msg); return; }
            shareStatus.textContent = msg;
            shareStatus.className = isError 
                ? "px-4 py-3 rounded-xl text-sm font-bold text-center bg-red-50 text-red-600 border border-red-100" 
                : "px-4 py-3 rounded-xl text-sm font-bold text-center bg-green-50 text-green-600 border border-green-100";
        };

        if (!identifier) {
            showStatus("Please enter an email or mobile number.");
            return;
        }

        if (!noteId || noteId === "undefined") {
            showStatus("Note ID is missing. Please refresh the page.");
            return;
        }

        if (!ownerId) {
            showStatus("User session expired. Please login again.");
            return;
        }

        try {
            const res = await fetch(`${API}/share-note`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ noteId, ownerId, identifier })
            });

            const data = await res.json();

            if (res.ok) {
                showStatus("Note shared successfully!", false);
                setTimeout(() => {
                    renderNotes();
                    closeShareModal();
                    shareStatus.className = "hidden";
                }, 1500);
            } else {
                showStatus(data.message || "Failed to share note");
            }
        } catch (err) {
            console.error("Fetch error during share:", err);
            showStatus("An error occurred during the request.");
        }
    }
    window.submitShare = submitShare;

    function renderNotes() {
    const user = JSON.parse(localStorage.getItem("data"));

    if (!user || (!user.id && !user._id)) {
        console.error("User ID is missing!");
        return;
    }

    let fetchUrl = `${API}/user/${user.id || user._id}`;
    if (currentTab === "favorites") fetchUrl = `${API}/${user.id}/favorites`;
    else if (currentTab === "shared") fetchUrl = `${API}/user/shared-notes/${user.id}`;

    fetch(fetchUrl)
        .then(res => {
            if (res.status === 404) return { data: [] }; 
            if (!res.ok) throw new Error("Failed to fetch notes");
            return res.json();
        })
        .then(data => {
            const notes = data.data || [];
            currentNotes = notes;

            if (!notes.length) {
                let emptyMsg = "No notes found.";
                if (currentTab === "favorites") emptyMsg = "No favorite notes found.";
                if (currentTab === "shared") emptyMsg = "No shared notes found.";
                notesList.innerHTML = `<div class="p-6 col-span-full text-center text-slate-500 bg-white dark:bg-slate-800 rounded-xl">${emptyMsg}</div>`;
                return;
            }

            if (currentTab === "shared") {
                notesList.innerHTML = notes.map(item => `
                    <div class="note bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between cursor-pointer transition-all hover:shadow-md h-[90px]" data-id="${item.shareId || item._id}" data-is-shared="true">
                        <div class="flex-1 min-w-0 pr-4 pointer-events-none">
                            <h3 class="font-bold text-[16px] text-slate-900 dark:text-slate-100 truncate flex items-center gap-2">
                                ${item.title || 'Untitled'}
                                <span class="text-[10px] uppercase tracking-tighter px-1.5 py-0.5 bg-primary/10 text-primary rounded-md">Shared</span>
                            </h3>
                            <p class="text-[13px] text-slate-500 dark:text-slate-400 truncate mt-1">${item.contentPreview ? item.contentPreview : ""}</p>
                        </div>
                        <div class="flex flex-col items-end shrink-0 gap-1.5 relative z-10">
                            <span class="text-[11px] text-slate-400 whitespace-nowrap pointer-events-none">${new Date(item.sharedAt).toDateString()}</span>
                            <span class="text-[11px] text-primary/70 font-black italic select-none pointer-events-none">By: ${item.sharedBy ? item.sharedBy.name : 'Unknown'}</span>
                            <div class="flex items-center gap-3">
                                <button class="text-[16px] transition-transform hover:scale-125 fav-btn" title="Favorite">
                                    ${item.isFavorite ? "⭐" : "☆"}
                                </button>
                                <button class="text-[16px] transition-transform hover:scale-125 share-btn" title="Share">🔗</button>
                                <button class="text-[16px] transition-transform hover:scale-125 edit-btn" title="Edit">✏️</button>
                                ${item.sharedType === 'shared_by_me' ? `
                                    <button class="text-[16px] transition-transform hover:scale-125 revoke-btn" title="Revoke Access">🚫</button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join("");
            } else {
                notesList.innerHTML = notes.map(note => `
                    <div class="note bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between cursor-pointer transition-all hover:shadow-md h-[90px]" data-id="${note.id || note._id}">
                        <div class="flex-1 min-w-0 pr-4 pointer-events-none">
                            <h3 class="font-bold text-[16px] text-slate-900 dark:text-slate-100 truncate">${note.title}</h3>
                            <p class="text-[13px] text-slate-500 dark:text-slate-400 truncate mt-1">${note.content}</p>
                        </div>
                        <div class="flex flex-col items-end shrink-0 gap-1.5 relative z-10">
                            <span class="text-[12px] text-slate-400 whitespace-nowrap pointer-events-none">${new Date(note.date).toDateString()}</span>
                            <div class="flex items-center gap-3">
                                <button class="text-[16px] transition-transform hover:scale-125 fav-btn" title="Favorite">
                                    ${note.isFavorite ? "⭐" : "☆"}
                                </button>
                                <button class="text-[16px] transition-transform hover:scale-125 share-btn" title="Share">🔗</button>
                                <button class="text-[16px] transition-transform hover:scale-125 edit-btn" title="Edit">✏️</button>
                                <button class="text-[16px] transition-transform hover:scale-125 delete-btn" title="Delete">🗑️</button>
                            </div>
                        </div>
                    </div>
                `).join("");
            }
            
            // Re-apply search filter if there's text in search input
            const searchInput = document.getElementById("searchInput");
            if (searchInput && searchInput.value) {
                searchInput.dispatchEvent(new Event('input'));
            }
        })
        .catch(err => {
            console.error(err);
            notesList.innerHTML = `<div class="p-6 col-span-full text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl">Failed to load notes</div>`;
        });
    }

    // Live search functionality
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const term = e.target.value.toLowerCase();
            const notesItems = document.querySelectorAll(".note");
            notesItems.forEach(item => {
                const title = item.querySelector("h3")?.textContent.toLowerCase() || "";
                const content = item.querySelector("p")?.textContent.toLowerCase() || "";
                if (title.includes(term) || content.includes(term)) {
                    item.style.display = "";
                } else {
                    item.style.display = "none";
                }
            });
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

