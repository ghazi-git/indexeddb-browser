import { Toaster, ToastProvider } from "solid-notifications";

function App() {
  return (
    <ToastProvider
      limit={1}
      positionX="right"
      positionY="top"
      showProgressBar={false}
      dismissButtonStyle={{ "box-shadow": "none" }}
    >
      <Toaster />
      <h1>Welcome to your devtools panel</h1>
    </ToastProvider>
  );
}

export default App;
