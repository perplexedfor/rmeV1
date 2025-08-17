import { useEffect, useMemo, useState } from "react";
import Sidebar from "./externalEditor/editor/components/sidebar";
import { Code } from "./externalEditor/editor/code";
import styled from "@emotion/styled";
import type { File } from "./externalEditor/utils/file-manager";
import { buildFileTree } from "./externalEditor/utils/file-manager";
import type { RemoteFile } from "./externalEditor/utils/file-manager";
import { FileTree } from "./externalEditor/editor/components/file-tree";

// credits - https://codesandbox.io/s/monaco-tree-pec7u
export const Editor = ({
    files,
    onSelect,
    selectedFile,
}: {
    files: RemoteFile[];
    onSelect: (file: File) => void;
    selectedFile: File | undefined;
}) => {

  const rootDir = useMemo(() => {
    return buildFileTree(files);
  }, [files]);

  useEffect(() => {
    if (!selectedFile) {
      onSelect(rootDir.files[0])
    }
  }, [selectedFile])

  return (
    <div>
      <Main>
        <Sidebar>
          <FileTree
            rootDir={rootDir}
            selectedFile={selectedFile}
            onSelect={onSelect}
          />
        </Sidebar>
        <Code selectedFile={selectedFile} />
      </Main>
    </div>
  );
};

const Main = styled.main`
  display: flex;
`;