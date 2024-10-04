import { backend } from "declarations/backend";

const fileInput = document.getElementById("fileInput");
const uploadButton = document.getElementById("uploadButton");
const fileList = document.getElementById("fileList");

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
    const files = await backend.getAllFiles();
    fileList.innerHTML = "<h3>Uploaded Files:</h3>";
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

uploadButton.onclick = uploadFile;

// Initial file list update
updateFileList();
