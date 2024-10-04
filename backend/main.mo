import Func "mo:base/Func";

import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Debug "mo:base/Debug";
import Text "mo:base/Text";

actor {
  // Type for storing file information
  type File = {
    name: Text;
    content: Blob;
  };

  // Stable variable to store files
  stable var files : [File] = [];

  // Function to upload a file
  public func uploadFile(name: Text, content: Blob) : async Text {
    let newFile : File = {
      name = name;
      content = content;
    };

    files := Array.append(files, [newFile]);
    Debug.print("File uploaded: " # name);
    "File uploaded successfully"
  };

  // Function to get all files
  public func getAllFiles() : async [Text] {
    Array.map<File, Text>(files, func(file) { file.name })
  };
}
