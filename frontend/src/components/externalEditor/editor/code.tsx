import Editor from "@monaco-editor/react";
import type { File } from "../utils/file-manager";

export const Code = ({ selectedFile }: { selectedFile: File | undefined }) => {
  if (!selectedFile)
    return null

  const code = selectedFile.content
  let language = selectedFile.name.split('.').pop()

  if (language === "js" || language === "jsx")
    language = "javascript";
  else if (language === "ts" || language === "tsx")
    language = "typescript"
  else if (language === "py" )
    language = "python"


  return (
      <Editor
        height="100vh"
        language={language}
        value={code}
        theme="vs-dark"
      />
  )
}