import { AuthClient } from "@dfinity/auth-client";
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "declarations/backend/backend.did.js";

const canisterId = process.env.CANISTER_ID_BACKEND || "REPLACE_WITH_ACTUAL_CANISTER_ID";

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
  updateStatus("Initializing...");
  try {
    authClient = await AuthClient.create({
      idleOptions: {
        disableDefaultIdleCallback: true,
        disableIdle: true
      }
    });
    if (await authClient.isAuthenticated()) {
      await handleAuthenticated();
    } else {
      updateUI(false);
    }
  } catch (error) {
    console.error("Initialization error:", error);
    updateStatus("Error initializing. Please refresh and try again.");
  }
}

async function login() {
  updateStatus("Logging in...");
  try {
    const identityProvider = process.env.DFX_NETWORK === "ic" 
      ? "https://identity.ic0.app"
      : `http://localhost:${process.env.IDENTITY_PORT}`;

    await authClient.login({
      identityProvider,
      onSuccess: handleAuthenticated,
      onError: (error) => {
        console.error("Login error:", error);
        updateStatus("Login failed. Please try again.");
        updateUI(false);
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    updateStatus("Login failed. Please try again.");
    updateUI(false);
  }
}

async function logout() {
  updateStatus("Logging out...");
  try {
    await authClient.logout();
    actor = null;
    updateUI(false);
    updateStatus("Logged out successfully.");
  } catch (error) {
    console.error("Logout error:", error);
    updateStatus("Logout failed. Please try again.");
  }
}

async function handleAuthenticated() {
  updateStatus("Authenticating...");
  try {
    const identity = await authClient.getIdentity();
    const agent = new HttpAgent({ identity });
    
    if (process.env.DFX_NETWORK !== "ic") {
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
    updateStatus("Authenticated successfully.");
  } catch (error) {
    console.error("Authentication error:", error);
    updateStatus("Authentication failed. Please try again.");
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

function updateStatus(message) {
  statusMessage.textContent = message;
}

async function uploadFile() {
  if (!actor) {
    updateStatus("Please login first");
    return;
  }

  const file = fileInput.files[0];
  if (!file) {
    updateStatus("Please select a file");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    updateStatus("File size exceeds 10MB limit");
    return;
  }

  updateStatus("Uploading file...");
  const reader = new FileReader();
  reader.onload = async (e) => {
    const content = new Uint8Array(e.target.result);
    try {
      const result = await actor.uploadFile(file.name, content);
      updateStatus(result);
      await updateFileList();
    } catch (error) {
      console.error("Upload error:", error);
      updateStatus("Error uploading file: " + error.message);
    }
  };
  reader.onerror = (error) => {
    console.error("FileReader error:", error);
    updateStatus("Error reading file: " + error.message);
  };
  reader.readAsArrayBuffer(file);
}

async function updateFileList() {
  if (!actor) {
    fileList.innerHTML = "<p>Please login to view your files.</p>";
    return;
  }

  updateStatus("Fetching files...");
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
    updateStatus("");
  } catch (error) {
    console.error("Error fetching files:", error);
    fileList.innerHTML = "<p>Error fetching files. Please try again later.</p>";
    updateStatus("Error fetching files.");
  }
}

loginButton.onclick = login;
logoutButton.onclick = logout;
uploadButton.onclick = uploadFile;

init();
