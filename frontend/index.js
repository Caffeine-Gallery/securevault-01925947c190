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

async function init() {
  authClient = await AuthClient.create();
  if (await authClient.isAuthenticated()) {
    handleAuthenticated();
  } else {
    loginButton.style.display = "block";
    logoutButton.style.display = "none";
    uploadSection.style.display = "none";
  }
}

async function login() {
  await authClient.login({
    identityProvider: "https://identity.ic0.app",
    onSuccess: handleAuthenticated,
  });
}

async function logout() {
  await authClient.logout();
  actor = null;
  loginButton.style.display = "block";
  logoutButton.style.display = "none";
  uploadSection.style.display = "none";
  fileList.innerHTML = "";
}

async function handleAuthenticated() {
  const identity = await authClient.getIdentity();
  const agent = new HttpAgent({ identity });
  await agent.fetchRootKey(); // This line is needed for local development only
  actor = Actor.createActor(idlFactory, {
    agent,
    canisterId: canisterId,
  });

  loginButton.style.display = "none";
  logoutButton.style.display = "block";
  uploadSection.style.display = "block";
  updateFileList();
}

async function uploadFile() {
  if (!actor) {
    alert("Please login first");
    return;
  }

  const file = fileInput.files[0];
  if (!file) {
    alert("Please select a file");
    return;
  }

  // Check file size (limit to 10MB for example)
  if (file.size > 10 * 1024 * 1024) {
    alert("File size exceeds 10MB limit");
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    const content = new Uint8Array(e.target.result);
    try {
      const result = await actor.uploadFile(file.name, content);
      alert(result);
      updateFileList();
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading file: " + error.message);
    }
  };
  reader.onerror = (error) => {
    console.error("FileReader error:", error);
    alert("Error reading file: " + error.message);
  };
  reader.readAsArrayBuffer(file);
}

async function updateFileList() {
  if (!actor) {
    fileList.innerHTML = "<p>Please login to view your files.</p>";
    return;
  }

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
  } catch (error) {
    console.error("Error fetching files:", error);
    fileList.innerHTML = "<p>Error fetching files. Please try again later.</p>";
  }
}

loginButton.onclick = login;
logoutButton.onclick = logout;
uploadButton.onclick = uploadFile;

init();
