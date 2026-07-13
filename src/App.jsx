import { Toaster } from 'react-hot-toast';
import { FormProvider } from './store/formStore';
import Wizard from './components/wizard/Wizard';
import ResumeModal from './components/wizard/ResumeModal';

export default function App() {
  return (
    <FormProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            borderRadius: '10px',
            background: '#1F2937',
            color: '#fff',
            fontSize: '13px',
          },
        }}
      />
      <ResumeModal />
      <Wizard />
    </FormProvider>
  );
}
