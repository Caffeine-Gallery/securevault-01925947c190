import { AuthClient } from "@dfinity/auth-client";
import { backend } from "declarations/backend";

let authClient;
let identity;

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
  loginButton.style.display = "block";
  logoutButton.style.display = "none";
  uploadSection.style.display = "none";
  fileList.innerHTML = "";
}

function handleAuthenticated() {
  identity = authClient.getIdentity();
  loginButton.style.display = "none";
  logoutButton.style.display = "block";
  uploadSection.style.display = "block";
  updateFileList();
}

async function uploadFile() {
  const file = fileInput.files[0];
  if (!file) {
    alert("Please select a file");
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    const content = new Uint8Array(e.target.result);
    try {
      const result = await backend.uploadFile(file.name, content);
      alert(result);
      updateFileList();
    } catch (error) {
      alert("Error uploading file: " + error.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

async function updateFileList() {
  try {
    const files = await backend.getMyFiles();
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
  }
}

loginButton.onclick = login;
logoutButton.onclick = logout;
uploadButton.onclick = uploadFile;

init();
