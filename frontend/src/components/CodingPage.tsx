import { useEffect, useState } from 'react';
import { Editor } from './Editor';
import type { File,RemoteFile } from './externalEditor/utils/file-manager';
import {  Type } from './externalEditor/utils/file-manager';
import { useSearchParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { Output } from './Output';
import { TerminalComponent as Terminal } from './Terminal';
import { Socket, io } from 'socket.io-client';
// import { EXECUTION_ENGINE_URI } from '../config';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end; /* Aligns children (button) to the right */
  padding: 10px; /* Adds some space around the button */
`;

const Workspace = styled.div`
  display: flex;
  margin: 0;
  font-size: 16px;
  width: 100%;
`;

const LeftPanel = styled.div`
  flex: 1;
  width: 60%;
`;

const RightPanel = styled.div`
  flex: 1;
  width: 40%;
`;

function useSocket(replId:string){
  const [socket,setSocket] = useState<Socket | null>(null);

  //cleaning the useEffect for this place okay
  useEffect(()=>{
    const newSocket = io(`http://localhost:3001?replId=${replId}`);
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };

  },[replId])

  return socket;
}

export const CodingPage = () => {
    const [searchParams] = useSearchParams();
    const replId = searchParams.get('replId') ?? '';
    const [loaded, setLoaded] = useState(false);
    const socket = useSocket(replId);

    const [fileStructure, setFileStructure] = useState<RemoteFile[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
    const [showOutput, setShowOutput] = useState(false);

    useEffect(()=>{
      if(socket){
        socket.on('loaded', ({ rootContent } : { rootContent: RemoteFile[]}) => {
          setLoaded(true);
          setFileStructure(rootContent);
        });
      }
    },[socket]);

    const onSelect = (file: File) => {
      //have done ts ignore but it can still overlap
      
      if (!file) {
        console.error("onSelect was called with an undefined item.");
        return; // Exit the function early if the item is undefined
      }

      //@ts-ignore
      if(file.type === Type.DIRECTORY) {
        
        //to remove the duplicates
        socket?.emit('fetchDir', file.path, (data: RemoteFile[]) => {
          setFileStructure(prev => {
            const allFiles = [...prev,...data];
            return allFiles.filter((file,index,self)=>{
              return self.findIndex(f => f.path === file.path) === index;
            })
          });
        });
      }else{
        console.log(file.path);

        socket?.emit('fetchContent', { path: file.path }, (data: string) => {
          file.content = data; // Update the file content
          setSelectedFile(file);
        });
      }
      //onSelect we have to fetch the contents of the file from the folder okay
    };
    
    if (!loaded) {
        return "Loading...";
    }

    return (
        <Container>
             <ButtonContainer>
                <button onClick={() => setShowOutput(!showOutput)}>See output</button>
            </ButtonContainer>
            <Workspace>
                <LeftPanel>
                    <Editor selectedFile={selectedFile} onSelect={onSelect} files={fileStructure} />
                </LeftPanel>
                <RightPanel>
                    {showOutput && <Output />}
                    <Terminal socket={socket} />
                </RightPanel>
            </Workspace>
        </Container>
    );
}