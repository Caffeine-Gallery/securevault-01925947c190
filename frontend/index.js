import { AuthClient } from "@dfinity/auth-client";
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "declarations/backend/backend.did.js";

const canisterId = process.env.CANISTER_ID_BACKEND;

let authClient;
let actor;

const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");
const uploadSection = document.getElementById("uploadSection");
const fileInput = document.getElementById("fileInput");
const uploadButton = document.getElementById("uploadButton");
const fileList = document.getElementById("fileList");
const statusMessage = document.getElementById("statusMessage");

async function init() {
  statusMessage.textContent = "Initializing...";
  try {
    authClient = await AuthClient.create();
    if (await authClient.isAuthenticated()) {
      await handleAuthenticated();
    } else {
      updateUI(false);
    }
  } catch (error) {
    console.error("Initialization error:", error);
    statusMessage.textContent = "Error initializing. Please try again.";
  }
  statusMessage.textContent = "";
}

async function login() {
  statusMessage.textContent = "Logging in...";
  try {
    await authClient.login({
      identityProvider: "https://identity.ic0.app",
      onSuccess: handleAuthenticated,
      onError: (error) => {
        console.error("Login error:", error);
        statusMessage.textContent = "Login failed. Please try again.";
        updateUI(false);
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    statusMessage.textContent = "Login failed. Please try again.";
    updateUI(false);
  }
}

async function logout() {
  statusMessage.textContent = "Logging out...";
  try {
    await authClient.logout();
    actor = null;
    updateUI(false);
    statusMessage.textContent = "Logged out successfully.";
  } catch (error) {
    console.error("Logout error:", error);
    statusMessage.textContent = "Logout failed. Please try again.";
  }
}

async function handleAuthenticated() {
  statusMessage.textContent = "Authenticating...";
  try {
    const identity = await authClient.getIdentity();
    const agent = new HttpAgent({ identity });
    
    // When developing locally, we need to set the local server as the host
    if (process.env.NODE_ENV !== "production") {
      agent.fetchRootKey().catch(err => {
        console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
        console.error(err);
      });
    }

    actor = Actor.createActor(idlFactory, {
      agent,
      canisterId: canisterId,
    });

    updateUI(true);
    await updateFileList();
  } catch (error) {
    console.error("Authentication error:", error);
    statusMessage.textContent = "Authentication failed. Please try again.";
    updateUI(false);
  }
}

function updateUI(isAuthenticated) {
  loginButton.style.display = isAuthenticated ? "none" : "block";
  logoutButton.style.display = isAuthenticated ? "block" : "none";
  uploadSection.style.display = isAuthenticated ? "block" : "none";
  if (!isAuthenticated) {
    fileList.innerHTML = "";
  }
}

async function uploadFile() {
  if (!actor) {
    statusMessage.textContent = "Please login first";
    return;
  }

  const file = fileInput.files[0];
  if (!file) {
    statusMessage.textContent = "Please select a file";
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    statusMessage.textContent = "File size exceeds 10MB limit";
    return;
  }

  statusMessage.textContent = "Uploading file...";
  const reader = new FileReader();
  reader.onload = async (e) => {
    const content = new Uint8Array(e.target.result);
    try {
      const result = await actor.uploadFile(file.name, content);
      statusMessage.textContent = result;
      await updateFileList();
    } catch (error) {
      console.error("Upload error:", error);
      statusMessage.textContent = "Error uploading file: " + error.message;
    }
  };
  reader.onerror = (error) => {
    console.error("FileReader error:", error);
    statusMessage.textContent = "Error reading file: " + error.message;
  };
  reader.readAsArrayBuffer(file);
}

async function updateFileList() {
  if (!actor) {
    fileList.innerHTML = "<p>Please login to view your files.</p>";
    return;
  }

  statusMessage.textContent = "Fetching files...";
  try {
    const files = await actor.getMyFiles();
    fileList.innerHTML = "<h3>Your Files:</h3>";
    if (files.length === 0) {
      fileList.innerHTML += "<p>No files uploaded yet.</p>";
    } else {
      const ul = document.createElement("ul");
      files.forEach((fileName) => {
        const li = document.createElement("li");
        li.textContent = fileName;
        ul.appendChild(li);
      });
      fileList.appendChild(ul);
    }
    statusMessage.textContent = "";
  } catch (error) {
    console.error("Error fetching files:", error);
    fileList.innerHTML = "<p>Error fetching files. Please try again later.</p>";
    statusMessage.textContent = "Error fetching files.";
  }
}

loginButton.onclick = login;
logoutButton.onclick = logout;
uploadButton.onclick = uploadFile;

init();
