import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    sendEmailVerification,
    sendPasswordResetEmail,
    updatePassword,
    deleteUser
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    getDocs,
    addDoc,
    query,
    where,
    onSnapshot,
    orderBy,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBW_99MWDKF97WqrN3cY5usUfz8m5Z9HGk",
  authDomain: "mysugarpartner-18559.firebaseapp.com",
  projectId: "mysugarpartner-18559",
  storageBucket: "mysugarpartner-18559.firebasestorage.app",
  messagingSenderId: "284798589498",
  appId: "1:284798589498:web:acaee9e664e23ed9b27303",
  measurementId: "G-CSB2RL6RXD"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// DOM Elements
const welcomeSection = document.getElementById("welcome-section");
const authCard = document.getElementById("auth-card");
const verificationSection = document.getElementById("verification-section");
const onboardingSection = document.getElementById("onboarding-section");
const dashboardSection = document.getElementById("dashboard-section");

const getStartedBtn = document.getElementById("show-auth-modal");
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authSubtitle = document.getElementById("auth-subtitle");
const authSubmitBtn = document.getElementById("auth-submit-btn");
const switchAuthModeBtn = document.getElementById("switch-auth-mode");
const switchText = document.getElementById("switch-text");
const logoutBtn = document.getElementById("logout-btn");
const userEmailDisplay = document.getElementById("user-email-display");
const resendVerificationBtn = document.getElementById("resend-verification-btn");
const checkVerificationBtn = document.getElementById("check-verification-btn");
const onboardingForm = document.getElementById("onboarding-form");
const profileCardContainer = document.getElementById("profile-card-container");
const editProfileBtn = document.getElementById("edit-profile-btn");
const deleteAccountBtn = document.getElementById("delete-account-btn");

const fieldName = document.getElementById("field-name");
const fieldPassword = document.getElementById("field-password");
const fieldConfirmPassword = document.getElementById("field-confirm-password");
const forgotPasswordLink = document.getElementById("forgot-password-link");
const backToLoginLink = document.getElementById("back-to-login-link");

// Tab Elements
const tabProfileBtn = document.getElementById("tab-profile-btn");
const tabFeedBtn = document.getElementById("tab-feed-btn");
const tabRequestsBtn = document.getElementById("tab-requests-btn");
const tabMatchesBtn = document.getElementById("tab-matches-btn");
const requestsBadge = document.getElementById("requests-badge");
const chatBadge = document.getElementById("chat-badge");

const profileTabContent = document.getElementById("profile-tab-content");
const feedTabContent = document.getElementById("feed-tab-content");
const requestsTabContent = document.getElementById("requests-tab-content");
const matchesTabContent = document.getElementById("matches-tab-content");

const communityFeedContainer = document.getElementById("community-feed-container");
const incomingRequestsContainer = document.getElementById("incoming-requests-container");
const outgoingRequestsContainer = document.getElementById("outgoing-requests-container");
const matchesListContainer = document.getElementById("matches-list-container");

// Chat & Call Elements
const chatHeader = document.getElementById("chat-header");
const chatMessages = document.getElementById("chat-messages");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatFileInput = document.getElementById("chat-file-input");
const videoCallBtn = document.getElementById("video-call-btn");

// Chat Preview Elements
const chatPreviewContainer = document.getElementById("chat-preview-container");
const chatImgPreview = document.getElementById("chat-img-preview");
const chatFileNamePreview = document.getElementById("chat-file-name-preview");
const removeAttachmentBtn = document.getElementById("remove-attachment-btn");

// Modal Elements
const profileModal = document.getElementById("profile-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const modalContent = document.getElementById("modal-content");
const modalActions = document.getElementById("modal-actions");

// Video Modal Elements
const videoModal = document.getElementById("video-modal");
const endCallBtn = document.getElementById("end-call-btn");
const localVideo = document.getElementById("local-video");
const remoteVideo = document.getElementById("remote-video");

// Search & Filter
const searchNameInput = document.getElementById("search-name");
const filterGoalSelect = document.getElementById("filter-goal");

let authMode = "login"; // "login", "signup-step1", "signup-step2", "forgot"
let allCommunityMembers = [];
let myLikesMap = new Map();
let incomingLikesMap = new Map();
let blockedUsersSet = new Set();
let currentChatUserId = null;
let unsubscribeChat = null;
let onlineStatusInterval = null;
let globalUnsubscribeListeners = [];

let peerConnection = null;
let localStream = null;
const servers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

const setAuthMode = (mode) => {
    authMode = mode;
    forgotPasswordLink.classList.add("hidden");
    backToLoginLink.classList.add("hidden");
    fieldName.classList.add("hidden");
    fieldConfirmPassword.classList.add("hidden");
    fieldPassword.classList.remove("hidden");

    if (mode === "login") {
        authTitle.textContent = "Welcome Back";
        authSubtitle.textContent = "Log in with your email and password.";
        authSubmitBtn.textContent = "Log In";
        switchText.textContent = "New here?";
        switchAuthModeBtn.textContent = "Create an Account";
        forgotPasswordLink.classList.remove("hidden");
    } else if (mode === "signup-step1") {
        authTitle.textContent = "Create Account (Step 1)";
        authSubtitle.textContent = "Enter your email to receive a verification link.";
        authSubmitBtn.textContent = "Send Verification Email";
        fieldPassword.classList.add("hidden");
        switchText.textContent = "Already have an account?";
        switchAuthModeBtn.textContent = "Log In";
    } else if (mode === "signup-step2") {
        authTitle.textContent = "Complete Registration (Step 2)";
        authSubtitle.textContent = "Email verified! Set your name and password.";
        authSubmitBtn.textContent = "Finish & Register";
        fieldName.classList.remove("hidden");
        fieldConfirmPassword.classList.remove("hidden");
        switchText.textContent = "";
        switchAuthModeBtn.textContent = "";
    } else if (mode === "forgot") {
        authTitle.textContent = "Reset Password";
        authSubtitle.textContent = "Enter your email to receive a password reset link.";
        authSubmitBtn.textContent = "Send Reset Link";
        fieldPassword.classList.add("hidden");
        backToLoginLink.classList.remove("hidden");
    }
};

switchAuthModeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (authMode === "login") setAuthMode("signup-step1");
    else setAuthMode("login");
});

forgotPasswordLink.addEventListener("click", (e) => {
    e.preventDefault();
    setAuthMode("forgot");
});

backToLoginLink.addEventListener("click", (e) => {
    e.preventDefault();
    setAuthMode("login");
});

getStartedBtn.addEventListener("click", () => {
    welcomeSection.classList.add("hidden");
    authCard.classList.remove("hidden");
    setAuthMode("login");
});

authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password") ? document.getElementById("password").value : "";
    const confirmPassword = document.getElementById("confirm-password") ? document.getElementById("confirm-password").value : "";
    const name = document.getElementById("signup-name") ? document.getElementById("signup-name").value.trim() : "";

    try {
        if (authMode === "login") {
            await signInWithEmailAndPassword(auth, email, password);
        } else if (authMode === "signup-step1") {
            const tempPassword = Math.random().toString(36).slice(-8) + "Aa1!";
            const userCred = await createUserWithEmailAndPassword(auth, email, tempPassword);
            await sendEmailVerification(userCred.user);
            alert("Verification email sent! Please check your inbox, click the verification link and confirm 'Yes', then come back and click continue.");
            authCard.classList.add("hidden");
            verificationSection.classList.remove("hidden");
        } else if (authMode === "signup-step2") {
            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }
            if (!name) {
                alert("Please enter your name.");
                return;
            }
            const user = auth.currentUser;
            if (user) {
                await updatePassword(user, password);
                await setDoc(doc(db, "users", user.uid), {
                    name: name,
                    email: user.email,
                    createdAt: new Date().toISOString()
                });
                alert("Registration successful! Welcome to MySugarPartner.");

                await renderProfileCard(user.uid);
                authCard.classList.add("hidden");
                onboardingSection.classList.add("hidden");
                dashboardSection.classList.remove("hidden");
                loadUserLikesAndFeed();
                setupGlobalMessageListeners(user.uid);
            }
        } else if (authMode === "forgot") {
            await sendPasswordResetEmail(auth, email);
            alert("Password reset link sent to your email! Check your inbox.");
            setAuthMode("login");
        }
    } catch (error) {
        alert("Error: " + error.message);
    }
});

checkVerificationBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) {
        alert("Session expired. Please log in again.");
        verificationSection.classList.add("hidden");
        authCard.classList.add("hidden");
        setAuthMode("login");
        return;
    }
    await user.reload();
    if (user.emailVerified) {
        verificationSection.classList.add("hidden");
        authCard.classList.add("hidden");
        setAuthMode("signup-step2");
    } else {
        alert("Email is not verified yet. Please click the verification link in your email first.");
    }
});

resendVerificationBtn.addEventListener("click", async () => {
    try {
        if (auth.currentUser) {
            await sendEmailVerification(auth.currentUser);
            alert("Verification email resent!");
        }
    } catch (error) {
        alert("Error: " + error.message);
    }
});

const startOnlineHeartbeat = (uid) => {
    if (onlineStatusInterval) clearInterval(onlineStatusInterval);
    const updatePresence = async () => {
        try {
            await setDoc(doc(db, "presence", uid), { lastSeen: new Date().toISOString() }, { merge: true });
        } catch (e) { console.error(e); }
    };
    updatePresence();
    onlineStatusInterval = setInterval(updatePresence, 30000);
};

const isUserOnline = (lastSeenString) => {
    if (!lastSeenString) return false;
    return (new Date().getTime() - new Date(lastSeenString).getTime()) < 60000;
};

const setupGlobalMessageListeners = async (uid) => {
    globalUnsubscribeListeners.forEach(unsub => unsub());
    globalUnsubscribeListeners = [];

    try {
        const acceptedLikes = await getDocs(query(collection(db, "likes"), where("status", "==", "accepted")));
        const mutualMatchIds = new Set();

        acceptedLikes.forEach(docSnap => {
            const data = docSnap.data();
            if (data.fromUserId === uid && !blockedUsersSet.has(data.toUserId)) mutualMatchIds.add(data.toUserId);
            if (data.toUserId === uid && !blockedUsersSet.has(data.fromUserId)) mutualMatchIds.add(data.fromUserId);
        });

        const unreadPerChat = {};

        mutualMatchIds.forEach(matchId => {
            const roomId = [uid, matchId].sort().join("_");
            const messagesRef = collection(db, "chats", roomId, "messages");
            
            const unsub = onSnapshot(messagesRef, (snapshot) => {
                let count = 0;
                snapshot.forEach(docSnap => {
                    const msg = docSnap.data();
                    const deletedForMe = msg.deletedFor && msg.deletedFor.includes(uid);
                    if (msg.senderId !== uid && msg.read === false && !deletedForMe) {
                        count++;
                    }
                });
                unreadPerChat[matchId] = count;

                let sum = 0;
                for (let key in unreadPerChat) {
                    sum += unreadPerChat[key];
                }

                if (sum > 0) {
                    chatBadge.classList.remove("hidden");
                } else {
                    chatBadge.classList.add("hidden");
                }
            });
            globalUnsubscribeListeners.push(unsub);
        });
    } catch (e) {
        console.error(e);
    }
};

window.sendLikeRequest = async (targetUserId) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    if (currentUser.uid === targetUserId) {
        alert("You cannot like yourself!");
        return;
    }

    const existingStatus = myLikesMap.get(targetUserId);
    if (existingStatus === "pending") {
        alert("You already have a pending request sent to this user!");
        return;
    }
    if (existingStatus === "accepted") {
        alert("You are already connected with this user! Check your Chats tab ✨");
        return;
    }

    try {
        const likeId = currentUser.uid + "_" + targetUserId;
        await setDoc(doc(db, "likes", likeId), {
            fromUserId: currentUser.uid,
            toUserId: targetUserId,
            status: "pending",
            timestamp: new Date().toISOString()
        });
        myLikesMap.set(targetUserId, "pending");
        alert("Like request sent! 💌");
        profileModal.classList.add("hidden");
        loadUserLikesAndFeed();
    } catch (error) {
        alert("Error: " + error.message);
    }
};

window.blockUser = async (targetUserId) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    if (!confirm("Are you sure you want to block this user?")) return;

    try {
        const blockId = currentUser.uid + "_" + targetUserId;
        await setDoc(doc(db, "blocks", blockId), {
            blockerId: currentUser.uid,
            blockedId: targetUserId,
            timestamp: new Date().toISOString()
        });
        blockedUsersSet.add(targetUserId);
        alert("User blocked successfully.");
        profileModal.classList.add("hidden");
        loadUserLikesAndFeed();
    } catch (error) {
        alert("Error: " + error.message);
    }
};

const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

const renderProfileCard = async (uid) => {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
        const data = userDoc.data();
        profileCardContainer.innerHTML = 
            '<div class="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">' +
            '<img src="' + (data.photoURL || defaultAvatar) + '" class="w-32 h-32 object-cover rounded-full shadow-md border-4 border-pink-500">' +
            '<div class="text-center sm:text-left flex-grow">' +
            '<h3 class="text-2xl font-bold text-gray-800">' + (data.name || 'Member') + (data.age ? ', ' + data.age : '') + '</h3>' +
            '<p class="text-pink-600 font-semibold mt-1">Intent: <span class="capitalize">' + (data.relationshipGoal || 'Not specified') + '</span></p>' +
            '<div class="mt-3 space-y-1 text-sm text-gray-600">' +
            '<p><span class="font-semibold text-gray-700">T1D History:</span> ' + (data.t1dHistory || 'Not specified') + '</p>' +
            '<p><span class="font-semibold text-gray-700">Country:</span> ' + (data.country || 'Not specified') + '</p>' +
            '<p><span class="font-semibold text-gray-700">Hobbies:</span> ' + (data.hobbies || 'Not specified') + '</p>' +
            '</div></div></div>';
    }
};

const loadUserLikesAndFeed = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    myLikesMap.clear();
    incomingLikesMap.clear();
    blockedUsersSet.clear();

    try {
        const blocksSnap1 = await getDocs(query(collection(db, "blocks"), where("blockerId", "==", currentUser.uid)));
        blocksSnap1.forEach(docSnap => blockedUsersSet.add(docSnap.data().blockedId));
        const blocksSnap2 = await getDocs(query(collection(db, "blocks"), where("blockedId", "==", currentUser.uid)));
        blocksSnap2.forEach(docSnap => blockedUsersSet.add(docSnap.data().blockerId));

        const myLikesSnap = await getDocs(query(collection(db, "likes"), where("fromUserId", "==", currentUser.uid)));
        myLikesSnap.forEach(docSnap => myLikesMap.set(docSnap.data().toUserId, docSnap.data().status));

        const incomingSnap = await getDocs(query(collection(db, "likes"), where("toUserId", "==", currentUser.uid)));
        incomingSnap.forEach(docSnap => incomingLikesMap.set(docSnap.data().fromUserId, { id: docSnap.id, ...docSnap.data() }));

        let pendingIncomingCount = 0;
        incomingLikesMap.forEach((val) => { if (val.status === "pending") pendingIncomingCount++; });
        if (pendingIncomingCount > 0) requestsBadge.classList.remove("hidden");
        else requestsBadge.classList.add("hidden");

        const querySnapshot = await getDocs(collection(db, "users"));
        allCommunityMembers = [];
        querySnapshot.forEach((docSnap) => {
            if (!blockedUsersSet.has(docSnap.id) && docSnap.id !== currentUser.uid) {
                allCommunityMembers.push({ id: docSnap.id, ...docSnap.data() });
            }
        });

        renderFilteredFeed(allCommunityMembers);
    } catch (error) {
        console.error(error);
    }
};

window.openProfileModal = async (memberId) => {
    const member = allCommunityMembers.find(m => m.id === memberId);
    if (!member) return;

    const presenceDoc = await getDoc(doc(db, "presence", memberId));
    const online = presenceDoc.exists() && isUserOnline(presenceDoc.data().lastSeen);
    const statusHtml = online 
        ? '<span class="inline-flex items-center text-xs text-green-600 font-semibold"><span class="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span> Online Now</span>'
        : '<span class="text-xs text-gray-400">Offline</span>';

    const likeStatus = myLikesMap.get(member.id);
    let btnText = "Send Like Request 💌";
    let btnDisabled = false;
    if (likeStatus === "pending") {
        btnText = "Request Pending ⏳";
        btnDisabled = true;
    } else if (likeStatus === "accepted") {
        btnText = "Connected ✨";
        btnDisabled = true;
    }

    modalContent.innerHTML = 
        '<div class="flex flex-col items-center text-center space-y-3">' +
        '<img src="' + (member.photoURL || defaultAvatar) + '" class="w-28 h-28 rounded-full object-cover border-4 border-pink-500 shadow-md">' +
        '<div><h3 class="text-xl font-bold text-gray-800">' + (member.name || 'Member') + (member.age ? ', ' + member.age : '') + '</h3>' + statusHtml + '</div>' +
        '<p class="text-pink-600 font-semibold text-sm">Intent: ' + (member.relationshipGoal || 'Not specified') + '</p>' +
        '<div class="w-full text-left bg-gray-50 p-4 rounded-xl space-y-2 text-xs text-gray-700">' +
        '<p><span class="font-bold">Country:</span> ' + (member.country || 'Not specified') + '</p>' +
        '<p><span class="font-bold">T1D History:</span> ' + (member.t1dHistory || 'Not specified') + '</p>' +
        '<p><span class="font-bold">Hobbies:</span> ' + (member.hobbies || 'Not specified') + '</p></div></div>';

    modalActions.innerHTML = 
        '<button onclick="window.sendLikeRequest(\'' + member.id + '\')" ' + (btnDisabled ? 'disabled class="w-full py-2.5 bg-gray-300 text-gray-600 font-bold rounded-xl text-xs cursor-not-allowed"' : 'class="w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-xs shadow transition"') + '>' + btnText + '</button>' +
        '<button onclick="window.blockUser(\'' + member.id + '\')" class="w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl text-xs transition">Block User</button>';

    profileModal.classList.remove("hidden");
};

closeModalBtn.addEventListener("click", () => profileModal.classList.add("hidden"));
profileModal.addEventListener("click", (e) => { if (e.target === profileModal) profileModal.classList.add("hidden"); });

const renderFilteredFeed = (members) => {
    const searchTerm = searchNameInput.value.toLowerCase().trim();
    const selectedGoal = filterGoalSelect.value;

    const filtered = members.filter(member => {
        const nameMatch = (member.name || "").toLowerCase().includes(searchTerm);
        const goalMatch = selectedGoal === "" || member.relationshipGoal === selectedGoal;
        return nameMatch && goalMatch;
    });

    let feedHTML = "";
    filtered.forEach((data) => {
        const likeStatus = myLikesMap.get(data.id);
        let btnText = "Send Like 💌";
        let btnClass = "px-4 py-1.5 bg-pink-100 hover:bg-pink-200 text-pink-700 text-xs font-bold rounded-lg transition";
        if (likeStatus === "pending") {
            btnText = "Pending ⏳";
            btnClass = "px-4 py-1.5 bg-gray-200 text-gray-600 text-xs font-bold rounded-lg cursor-not-allowed";
        } else if (likeStatus === "accepted") {
            btnText = "Matched ✨";
            btnClass = "px-4 py-1.5 bg-pink-600 text-white text-xs font-bold rounded-lg";
        }

        feedHTML += 
            '<div class="bg-gray-50 border rounded-xl p-4 flex flex-col items-center sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-4 shadow-sm">' +
            '<img src="' + (data.photoURL || defaultAvatar) + '" class="w-20 h-20 object-cover rounded-full border-2 border-pink-500 flex-shrink-0 cursor-pointer" onclick="window.openProfileModal(\'' + data.id + '\')">' +
            '<div class="flex-grow text-center sm:text-left">' +
            '<h4 class="text-lg font-bold text-gray-800 cursor-pointer hover:text-pink-600" onclick="window.openProfileModal(\'' + data.id + '\')">' + (data.name || 'Member') + (data.age ? ', ' + data.age : '') + '</h4>' +
            '<p class="text-xs text-pink-600 font-semibold">Intent: ' + (data.relationshipGoal || 'Not specified') + '</p>' +
            '<p class="text-xs text-gray-600 mt-1"><span class="font-medium">Country:</span> ' + (data.country || 'Not specified') + '</p>' +
            '<div class="mt-3 flex space-x-2 justify-center sm:justify-start">' +
            '<button onclick="window.sendLikeRequest(\'' + data.id + '\')" class="' + btnClass + '">' + btnText + '</button>' +
            '<button onclick="window.openProfileModal(\'' + data.id + '\')" class="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-lg transition">View Profile</button>' +
            '</div></div></div>';
    });

    communityFeedContainer.innerHTML = feedHTML || '<p class="text-center text-gray-500 col-span-2">No members found.</p>';
};

window.respondToRequest = async (fromUserId, status) => {
    try {
        const likeId = fromUserId + "_" + auth.currentUser.uid;
        await setDoc(doc(db, "likes", likeId), { status: status }, { merge: true });
        alert(status === 'accepted' ? "Request accepted! Chat unlocked ✨" : "Request declined.");
        loadRequestsTab();
        loadUserLikesAndFeed();
        setupGlobalMessageListeners(auth.currentUser.uid);
    } catch (error) {
        alert("Error: " + error.message);
    }
};

const loadRequestsTab = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    incomingRequestsContainer.innerHTML = '<p class="text-xs text-gray-400">Loading incoming requests...</p>';
    outgoingRequestsContainer.innerHTML = '<p class="text-xs text-gray-400">Loading outgoing requests...</p>';

    try {
        let incomingHTML = "";
        const incomingSnap = await getDocs(query(collection(db, "likes"), where("toUserId", "==", currentUser.uid)));
        for (const docSnap of incomingSnap.docs) {
            const data = docSnap.data();
            if (blockedUsersSet.has(data.fromUserId)) continue;
            const userDoc = await getDoc(doc(db, "users", data.fromUserId));
            if (userDoc.exists() && data.status === "pending") {
                const uData = userDoc.data();
                incomingHTML += 
                    '<div class="flex items-center justify-between p-3 bg-gray-50 border rounded-xl">' +
                    '<div class="flex items-center space-x-3">' +
                    '<img src="' + (uData.photoURL || defaultAvatar) + '" class="w-12 h-12 rounded-full object-cover border-2 border-pink-500">' +
                    '<div><h5 class="font-bold text-xs text-gray-800">' + (uData.name || 'Member') + '</h5><p class="text-[10px] text-pink-600 font-semibold">Wants to connect 💕</p></div>' +
                    '</div><div class="flex space-x-2">' +
                    '<button onclick="window.respondToRequest(\'' + data.fromUserId + '\', \'accepted\')" class="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-lg">Accept</button>' +
                    '<button onclick="window.respondToRequest(\'' + data.fromUserId + '\', \'rejected\')" class="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-lg">Decline</button>' +
                    '</div></div>';
            }
        }
        incomingRequestsContainer.innerHTML = incomingHTML || '<p class="text-xs text-gray-400">No pending incoming requests.</p>';

        let outgoingHTML = "";
        const outgoingSnap = await getDocs(query(collection(db, "likes"), where("fromUserId", "==", currentUser.uid)));
        for (const docSnap of outgoingSnap.docs) {
            const data = docSnap.data();
            const userDoc = await getDoc(doc(db, "users", data.toUserId));
            if (userDoc.exists()) {
                const uData = userDoc.data();
                outgoingHTML += 
                    '<div class="flex items-center justify-between p-3 bg-gray-50 border rounded-xl">' +
                    '<div class="flex items-center space-x-3">' +
                    '<img src="' + (uData.photoURL || defaultAvatar) + '" class="w-12 h-12 rounded-full object-cover border-2 border-pink-500">' +
                    '<div><h5 class="font-bold text-xs text-gray-800">' + (uData.name || 'Member') + '</h5><p class="text-[10px] text-gray-500 capitalize">Status: ' + data.status + '</p></div>' +
                    '</div></div>';
            }
        }
        outgoingRequestsContainer.innerHTML = outgoingHTML || '<p class="text-xs text-gray-400">No outgoing requests.</p>';
    } catch (error) {
        console.error(error);
    }
};

const loadMatches = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    matchesListContainer.innerHTML = '<p class="text-sm text-gray-500 text-center">Loading chats...</p>';

    try {
        const acceptedLikes = await getDocs(query(collection(db, "likes"), where("status", "==", "accepted")));
        const mutualMatchIds = new Set();

        acceptedLikes.forEach(docSnap => {
            const data = docSnap.data();
            if (data.fromUserId === currentUser.uid && !blockedUsersSet.has(data.toUserId)) mutualMatchIds.add(data.toUserId);
            if (data.toUserId === currentUser.uid && !blockedUsersSet.has(data.fromUserId)) mutualMatchIds.add(data.fromUserId);
        });

        if (mutualMatchIds.size === 0) {
            matchesListContainer.innerHTML = '<p class="text-sm text-gray-400 text-center mt-10">No unlocked chats yet. Accept or send requests! 💕</p>';
            return;
        }

        let listHTML = "";
        
        for (const matchId of mutualMatchIds) {
            const userDoc = await getDoc(doc(db, "users", matchId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const presenceDoc = await getDoc(doc(db, "presence", matchId));
                const online = presenceDoc.exists() && isUserOnline(presenceDoc.data().lastSeen);
                const onlineDot = online ? '<span class="w-2.5 h-2.5 bg-green-500 rounded-full inline-block mr-1"></span>' : '';

                const roomId = [currentUser.uid, matchId].sort().join("_");
                const messagesRef = collection(db, "chats", roomId, "messages");
                const snapshot = await getDocs(messagesRef);
                
                let unreadCount = 0;
                snapshot.forEach(docSnap => {
                    const msg = docSnap.data();
                    const deletedForMe = msg.deletedFor && msg.deletedFor.includes(currentUser.uid);
                    if (msg.senderId === matchId && msg.read === false && !deletedForMe) {
                        unreadCount++;
                    }
                });

                const badgeHTML = unreadCount > 0 
                    ? '<span class="ml-auto px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full shadow">' + unreadCount + '</span>' 
                    : '';

                listHTML += 
                    '<div onclick="window.openChat(\'' + matchId + '\', \'' + (userData.name || 'Member') + '\')" class="flex items-center space-x-3 p-3 bg-gray-50 hover:bg-pink-50 border rounded-xl cursor-pointer transition">' +
                    '<img src="' + (userData.photoURL || defaultAvatar) + '" class="w-12 h-12 rounded-full object-cover border-2 border-pink-500 flex-shrink-0">' +
                    '<div class="flex-grow min-w-0">' +
                    '<div class="flex justify-between items-center"><h4 class="font-bold text-gray-800 text-sm truncate">' + (userData.name || 'Member') + '</h4>' + badgeHTML + '</div>' +
                    '<p class="text-xs text-pink-600 font-semibold flex items-center mt-0.5">' + onlineDot + ' Unlocked Chat ✨</p>' +
                    '</div></div>';
            }
        }
        matchesListContainer.innerHTML = listHTML;
    } catch (error) {
        matchesListContainer.innerHTML = '<p class="text-sm text-red-500 text-center">Error loading chats.</p>';
    }
};

window.clearChatHistory = async () => {
    if (!currentChatUserId) return;
    if (!confirm("Are you sure you want to clear your chat history? This will only clear it on your screen.")) return;

    const currentUser = auth.currentUser;
    const roomId = [currentUser.uid, currentChatUserId].sort().join("_");
    const messagesRef = collection(db, "chats", roomId, "messages");

    try {
        const snapshot = await getDocs(messagesRef);
        const batch = writeBatch(db);
        
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const deletedFor = data.deletedFor || [];
            if (!deletedFor.includes(currentUser.uid)) {
                deletedFor.push(currentUser.uid);
                batch.update(docSnap.ref, { deletedFor: deletedFor });
            }
        });

        await batch.commit();
        alert("Chat history cleared for you.");
    } catch (error) {
        alert("Error clearing chat: " + error.message);
    }
};

window.openChat = async (matchId, matchName) => {
    currentChatUserId = matchId;
    
    chatHeader.innerHTML = 
        '<div class="flex justify-between items-center w-full">' +
        '<span>Chat with ' + matchName + '</span>' +
        '<button onclick="window.clearChatHistory()" class="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-600 text-[10px] font-bold rounded-lg transition">Clear History</button>' +
        '</div>';

    chatForm.classList.remove("hidden");
    videoCallBtn.classList.remove("hidden");

    const currentUser = auth.currentUser;
    const roomId = [currentUser.uid, matchId].sort().join("_");
    const messagesRef = collection(db, "chats", roomId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    if (unsubscribeChat) unsubscribeChat();

    try {
        const unreadSnap = await getDocs(query(messagesRef, where("senderId", "==", matchId), where("read", "==", false)));
        unreadSnap.forEach(async (msgDoc) => {
            const data = msgDoc.data();
            if (!data.deletedFor || !data.deletedFor.includes(currentUser.uid)) {
                await updateDoc(doc(db, "chats", roomId, "messages", msgDoc.id), { read: true });
            }
        });
    } catch (e) {
        console.error(e);
    }

    unsubscribeChat = onSnapshot(q, async (snapshot) => {
        let messagesHTML = "";
        const batchUpdates = [];

        snapshot.forEach((docSnap) => {
            const msg = docSnap.data();

            if (msg.deletedFor && msg.deletedFor.includes(currentUser.uid)) {
                return;
            }

            const isMe = msg.senderId === currentUser.uid;
            const bubbleClass = isMe ? "bg-pink-600 text-white ml-auto rounded-l-xl rounded-tr-xl" : "bg-white text-gray-800 border mr-auto rounded-r-xl rounded-tl-xl";

            if (!isMe && msg.read === false) {
                batchUpdates.push(updateDoc(doc(db, "chats", roomId, "messages", docSnap.id), { read: true }));
            }

            let receiptHTML = "";
            if (isMe) {
                const tickColor = msg.read ? "text-cyan-200" : "text-white/70";
                const ticks = msg.read ? "✓✓" : "✓";
                receiptHTML = '<span class="ml-2 text-[10px] font-bold ' + tickColor + '">' + ticks + '</span>';
            }

            let contentHTML = '<p>' + (msg.text || '') + '</p>';
            if (msg.fileData) {
                const downloadBtn = '<a href="' + msg.fileData + '" download="' + (msg.fileName || 'saved-file') + '" class="inline-flex items-center mt-2 px-2.5 py-1 bg-black/20 hover:bg-black/30 text-white text-[10px] font-bold rounded-lg transition">⬇ Save File</a>';
                
                if (msg.fileType && msg.fileType.startsWith('image/')) {
                    contentHTML += '<div class="mt-2"><img src="' + msg.fileData + '" class="max-w-xs rounded-lg max-h-48 object-cover"><br>' + downloadBtn + '</div>';
                } else if (msg.fileType && msg.fileType.startsWith('video/')) {
                    contentHTML += '<div class="mt-2"><video controls class="max-w-xs rounded-lg max-h-48"><source src="' + msg.fileData + '"></video><br>' + downloadBtn + '</div>';
                } else if (msg.fileType && msg.fileType.startsWith('audio/')) {
                    contentHTML += '<div class="mt-2"><audio controls class="w-full"><source src="' + msg.fileData + '"></audio><br>' + downloadBtn + '</div>';
                } else {
                    contentHTML += '<div class="mt-2"><p class="text-xs font-semibold">📎 ' + (msg.fileName || 'Document') + '</p>' + downloadBtn + '</div>';
                }
            }

            messagesHTML += '<div class="max-w-[75%] p-3 rounded-xl shadow-sm text-xs ' + bubbleClass + '">' + contentHTML + '<div class="text-right">' + receiptHTML + '</div></div>';
        });

        if (batchUpdates.length > 0) {
            await Promise.all(batchUpdates);
        }

        chatMessages.innerHTML = messagesHTML || '<p class="text-center text-gray-400 text-xs mt-10">Say hello! 👋</p>';
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
};

if (chatFileInput) {
    chatFileInput.addEventListener("change", () => {
        const file = chatFileInput.files[0];
        if (file) {
            chatPreviewContainer?.classList.remove("hidden");
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (chatImgPreview) {
                        chatImgPreview.src = e.target.result;
                        chatImgPreview.classList.remove("hidden");
                    }
                    chatFileNamePreview?.classList.add("hidden");
                };
                reader.readAsDataURL(file);
            } else {
                chatImgPreview?.classList.add("hidden");
                if (chatFileNamePreview) {
                    chatFileNamePreview.textContent = "📎 " + file.name;
                    chatFileNamePreview.classList.remove("hidden");
                }
            }
        } else {
            chatPreviewContainer?.classList.add("hidden");
        }
    });
}

if (removeAttachmentBtn) {
    removeAttachmentBtn.addEventListener("click", () => {
        if (chatFileInput) chatFileInput.value = "";
        chatPreviewContainer?.classList.add("hidden");
        if (chatImgPreview) chatImgPreview.src = "";
        if (chatFileNamePreview) chatFileNamePreview.textContent = "";
    });
}

chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser || !currentChatUserId) return;

    const text = chatInput.value.trim();
    const file = chatFileInput.files[0];
    if (!text && !file) return;

    let fileData = null, fileName = null, fileType = null;
    if (file) {
        fileData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                if (file.type.startsWith('image/')) {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onload = () => {
                        const canvas = document.createElement("canvas");
                        const MAX_WIDTH = 800;
                        const MAX_HEIGHT = 800;
                        let width = img.width;
                        let height = img.height;

                        if (width > height) {
                            if (width > MAX_WIDTH) {
                                height *= MAX_WIDTH / width;
                                width = MAX_WIDTH;
                            }
                        } else {
                            if (height > MAX_HEIGHT) {
                                width *= MAX_HEIGHT / height;
                                height = MAX_HEIGHT;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL("image/jpeg", 0.7));
                    };
                } else {
                    resolve(event.target.result);
                }
            };
        });
        fileName = file.name;
        fileType = file.type;
    }

    const roomId = [currentUser.uid, currentChatUserId].sort().join("_");
    try {
        await addDoc(collection(db, "chats", roomId, "messages"), {
            senderId: currentUser.uid,
            text: text,
            fileData: fileData,
            fileName: fileName,
            fileType: fileType,
            read: false,
            deletedFor: [],
            timestamp: new Date().toISOString()
        });
        chatInput.value = "";
        chatFileInput.value = "";
        chatPreviewContainer?.classList.add("hidden");
        if (chatImgPreview) chatImgPreview.src = "";
        if (chatFileNamePreview) chatFileNamePreview.textContent = "";
    } catch (error) {
        alert("Error sending message: " + error.message);
    }
});

videoCallBtn.addEventListener("click", async () => {
    videoModal.classList.remove("hidden");
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;

        peerConnection = new RTCPeerConnection(servers);
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        peerConnection.ontrack = (event) => { remoteVideo.srcObject = event.streams[0]; };

        const currentUser = auth.currentUser;
        const roomId = [currentUser.uid, currentChatUserId].sort().join("_");
        const callDocRef = doc(db, "calls", roomId);

        peerConnection.onicecandidate = async (event) => {
            if (event.candidate) await setDoc(callDocRef, { candidate: event.candidate.toJSON() }, { merge: true });
        };

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        await setDoc(callDocRef, { offer: { type: offer.type, sdp: offer.sdp } });

        onSnapshot(callDocRef, async (snapshot) => {
            const data = snapshot.data();
            if (data && data.answer && !peerConnection.currentRemoteDescription) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            }
            if (data && data.candidate && peerConnection) {
                try { await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch (e) { console.error(e); }
            }
        });
    } catch (err) {
        alert("Camera error: " + err.message);
        videoModal.classList.add("hidden");
    }
});

endCallBtn.addEventListener("click", () => {
    if (localStream) localStream.getTracks().forEach(track => track.stop());
    if (peerConnection) peerConnection.close();
    peerConnection = null;
    videoModal.classList.add("hidden");
});

searchNameInput.addEventListener("input", () => renderFilteredFeed(allCommunityMembers));
filterGoalSelect.addEventListener("change", () => renderFilteredFeed(allCommunityMembers));

tabProfileBtn.addEventListener("click", () => {
    tabProfileBtn.className = "px-4 py-2 bg-pink-600 text-white rounded-lg font-semibold shadow transition text-xs sm:text-sm";
    tabFeedBtn.className = "px-4 py-2 bg-white text-pink-600 border border-pink-600 rounded-lg font-semibold shadow transition text-xs sm:text-sm hover:bg-pink-50";
    tabRequestsBtn.className = "relative px-4 py-2 bg-white text-pink-600 border border-pink-600 rounded-lg font-semibold shadow transition text-xs sm:text-sm hover:bg-pink-50";
    tabMatchesBtn.className = "relative px-4 py-2 bg-white text-pink-600 border border-pink-600 rounded-lg font-semibold shadow transition text-xs sm:text-sm hover:bg-pink-50";
    profileTabContent.classList.remove("hidden");
    feedTabContent.classList.add("hidden");
    requestsTabContent.classList.add("hidden");
    matchesTabContent.classList.add("hidden");
});

tabFeedBtn.addEventListener("click", () => {
    tabFeedBtn.className = "px-4 py-2 bg-pink-600 text-white rounded-lg font-semibold shadow transition text-xs sm:text-sm";
    tabProfileBtn.className = "px-4 py-2 bg-white text-pink-600 border border-pink-600 rounded-lg font-semibold shadow transition text-xs sm:text-sm hover:bg-pink-50";
    tabRequestsBtn.className = "relative px-4 py-2 bg-white text-pink-600 border border-pink-600 rounded-lg font-semibold shadow transition text-xs sm:text-sm hover:bg-pink-50";
    tabMatchesBtn.className = "relative px-4 py-2 bg-white text-pink-600 border border-pink-600 rounded-lg font-semibold shadow transition text-xs sm:text-sm hover:bg-pink-50";
    feedTabContent.classList.remove("hidden");
    profileTabContent.classList.add("hidden");
    requestsTabContent.classList.add("hidden");
    matchesTabContent.classList.add("hidden");
    loadUserLikesAndFeed();
});

tabRequestsBtn.addEventListener("click", () => {
    tabRequestsBtn.className = "px-4 py-2 bg-pink-600 text-white rounded-lg font-semibold shadow transition text-xs sm:text-sm";
    tabProfileBtn.className = "px-4 py-2 bg-white text-pink-600 border border-pink-600 rounded-lg font-semibold shadow transition text-xs sm:text-sm hover:bg-pink-50";
    tabFeedBtn.className = "px-4 py-2 bg-white text-pink-600 border border-pink-600 rounded-lg font-semibold shadow transition text-xs sm:text-sm hover:bg-pink-50";
    tabMatchesBtn.className = "relative px-4 py-2 bg-white text-pink-600 border border-pink-600 rounded-lg font-semibold shadow transition text-xs sm:text-sm hover:bg-pink-50";
    requestsTabContent.classList.remove("hidden");
    profileTabContent.classList.add("hidden");
    feedTabContent.classList.add("hidden");
    matchesTabContent.classList.add("hidden");
    requestsBadge.classList.add("hidden");
    loadRequestsTab();
});

tabMatchesBtn.addEventListener("click", () => {
    tabMatchesBtn.className = "px-4 py-2 bg-pink-600 text-white rounded-lg font-semibold shadow transition text-xs sm:text-sm";
    tabProfileBtn.className = "px-4 py-2 bg-white text-pink-600 border border-pink-600 rounded-lg font-semibold shadow transition text-xs sm:text-sm hover:bg-pink-50";
    tabFeedBtn.className = "px-4 py-2 bg-white text-pink-600 border border-pink-600 rounded-lg font-semibold shadow transition text-xs sm:text-sm hover:bg-pink-50";
    tabRequestsBtn.className = "relative px-4 py-2 bg-white text-pink-600 border border-pink-600 rounded-lg font-semibold shadow transition text-xs sm:text-sm hover:bg-pink-50";
    matchesTabContent.classList.remove("hidden");
    profileTabContent.classList.add("hidden");
    feedTabContent.classList.add("hidden");
    requestsTabContent.classList.add("hidden");
    loadMatches();
});

editProfileBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.value = val !== undefined && val !== null ? val : "";
            };
            setVal("profile-name", data.name);
            setVal("profile-age", data.age);
            setVal("profile-t1d-history", data.t1dHistory);
            setVal("profile-complications", data.complications);
            setVal("profile-goal", data.relationshipGoal || "Dating");
            setVal("profile-country", data.country);
            setVal("profile-hobbies", data.hobbies);
        }
        dashboardSection.classList.add("hidden");
        onboardingSection.classList.remove("hidden");
    } catch (err) {
        alert("Error loading profile: " + err.message);
    }
});

deleteAccountBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) return;
    if (!confirm("Are you sure you want to delete your account? This action is permanent and frees up your email address.")) return;

    try {
        await deleteDoc(doc(db, "users", user.uid));
        await deleteDoc(doc(db, "presence", user.uid)).catch(() => {});
        await deleteUser(user);
        alert("Your account has been successfully deleted. You can now use this email to create a fresh account.");
    } catch (error) {
        if (error.code === 'auth/requires-recent-login') {
            alert("For security reasons, please log out and log back in before deleting your account.");
        } else {
            alert("Error deleting account: " + error.message);
        }
    }
});

onboardingForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const fileInput = document.getElementById("profile-pic");
    const file = fileInput && fileInput.files ? fileInput.files[0] : null;
    let photoURL = "";

    const newPasswordInput = document.getElementById("edit-new-password");
    if (newPasswordInput && newPasswordInput.value.trim() !== "") {
        try {
            await updatePassword(user, newPasswordInput.value.trim());
            newPasswordInput.value = "";
        } catch (err) {
            alert("Password update failed: " + err.message);
            return;
        }
    }

    try {
        if (file) {
            photoURL = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onload = () => {
                        const canvas = document.createElement("canvas");
                        const MAX_WIDTH = 400;
                        const MAX_HEIGHT = 400;
                        let width = img.width;
                        let height = img.height;

                        if (width > height) {
                            if (width > MAX_WIDTH) {
                                height *= MAX_WIDTH / width;
                                width = MAX_WIDTH;
                            }
                        } else {
                            if (height > MAX_HEIGHT) {
                                width *= MAX_HEIGHT / height;
                                height = MAX_HEIGHT;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL("image/jpeg", 0.7));
                    };
                };
            });
        } else {
            const existingDoc = await getDoc(doc(db, "users", user.uid));
            if (existingDoc.exists()) photoURL = existingDoc.data().photoURL || "";
        }

        const getVal = (id) => {
            const el = document.getElementById(id);
            return el ? el.value : "";
        };

        const profileData = {
            name: getVal("profile-name"),
            age: Number(getVal("profile-age")) || 0,
            t1dHistory: getVal("profile-t1d-history"),
            complications: getVal("profile-complications"),
            relationshipGoal: getVal("profile-goal") || "Dating",
            country: getVal("profile-country"),
            hobbies: getVal("profile-hobbies"),
            photoURL: photoURL,
            email: user.email,
            createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, "users", user.uid), profileData, { merge: true });
        alert("Profile saved successfully!");
        await renderProfileCard(user.uid);
        onboardingSection.classList.add("hidden");
        dashboardSection.classList.remove("hidden");
        setupGlobalMessageListeners(user.uid);
    } catch (error) {
        alert("Error saving profile: " + error.message);
    }
});

logoutBtn.addEventListener("click", async () => {
    if (onlineStatusInterval) clearInterval(onlineStatusInterval);
    globalUnsubscribeListeners.forEach(unsub => unsub());
    globalUnsubscribeListeners = [];
    if (unsubscribeChat) unsubscribeChat();
    await signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        await user.reload();
        startOnlineHeartbeat(user.uid);
        setupGlobalMessageListeners(user.uid);
        welcomeSection.classList.add("hidden");
        authCard.classList.add("hidden");
        verificationSection.classList.add("hidden");

        if (!user.emailVerified) {
            verificationSection.classList.remove("hidden");
            onboardingSection.classList.add("hidden");
            dashboardSection.classList.add("hidden");
            logoutBtn.classList.remove("hidden");
            userEmailDisplay.textContent = user.email;
        } else {
            logoutBtn.classList.remove("hidden");
            userEmailDisplay.textContent = user.email;

            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                await renderProfileCard(user.uid);
                onboardingSection.classList.add("hidden");
                dashboardSection.classList.remove("hidden");
            } else {
                dashboardSection.classList.add("hidden");
                onboardingSection.classList.remove("hidden");
            }
        }
    } else {
        if (onlineStatusInterval) clearInterval(onlineStatusInterval);
        globalUnsubscribeListeners.forEach(unsub => unsub());
        globalUnsubscribeListeners = [];
        if (unsubscribeChat) unsubscribeChat();
        welcomeSection.classList.remove("hidden");
        authCard.classList.add("hidden");
        verificationSection.classList.add("hidden");
        onboardingSection.classList.add("hidden");
        dashboardSection.classList.add("hidden");
        logoutBtn.classList.add("hidden");
        userEmailDisplay.textContent = "";
    }
});