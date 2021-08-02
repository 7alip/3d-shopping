import { ChakraProvider } from '@chakra-ui/react';
import { SceneComponent } from './components/SceneComponent';

function App() {
  return (
    <ChakraProvider>
      <SceneComponent />
    </ChakraProvider>
  );
}

export default App;
