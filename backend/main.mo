import Bool "mo:base/Bool";
import Func "mo:base/Func";

import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Principal "mo:base/Principal";
import Text "mo:base/Text";

actor {
  // Type for storing file information
  type File = {
    name: Text;
    content: Blob;
    owner: Principal;
  };

  // Stable variable to store files
  stable var files : [File] = [];

  // Function to upload a file
  public shared(msg) func uploadFile(name: Text, content: Blob) : async Text {
    let caller = msg.caller;

    if (Principal.isAnonymous(caller)) {
      Debug.print("Anonymous user attempted to upload file");
      throw Error.reject("Authentication required");
    };

    if (Text.size(name) == 0) {
      Debug.print("Attempted to upload file with empty name");
      throw Error.reject("File name cannot be empty");
    };

    if (Blob.toArray(content).size() == 0) {
      Debug.print("Attempted to upload empty file");
      throw Error.reject("File content cannot be empty");
    };

    let newFile : File = {
      name = name;
      content = content;
      owner = caller;
    };

    files := Array.append(files, [newFile]);
    Debug.print("File uploaded successfully: " # name # " by " # Principal.toText(caller));
    "File uploaded successfully"
  };

  // Function to get all files for the authenticated user
  public shared(msg) func getMyFiles() : async [Text] {
    let caller = msg.caller;

    if (Principal.isAnonymous(caller)) {
      Debug.print("Anonymous user attempted to retrieve files");
      throw Error.reject("Authentication required");
    };

    let myFiles = Array.filter<File>(files, func(file) { file.owner == caller });
    Array.map<File, Text>(myFiles, func(file) { file.name })
  };

  // Function to check if a user is authenticated
  public shared(msg) func isAuthenticated() : async Bool {
    not Principal.isAnonymous(msg.caller)
  };
}
