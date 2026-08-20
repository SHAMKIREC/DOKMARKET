import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import ScrollToHash from '@/components/ScrollToHash';
import JoinRoom from './pages/JoinRoom';
import ForLawyers from './pages/ForLawyers';
import BusinessCabinet from './pages/BusinessCabinet';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterLawyer from './pages/RegisterLawyer';
import Forbidden from './pages/Forbidden';
import Market from './pages/Market';
import PlatformHome from './pages/PlatformHome';
import PlatformReviews from './pages/PlatformReviews';
import MarketOffer from './pages/MarketOffer';
import MarketSpecialist from './pages/MarketSpecialist';
import MarketFavorites from './pages/MarketFavorites';
import MarketCart from './pages/MarketCart';
import TemplateStudio from './pages/TemplateStudio';
import TemplateStudioNew from './pages/TemplateStudioNew';
import TemplateStudioEditor from './pages/TemplateStudioEditor';
import TemplateStudioFill from './pages/TemplateStudioFill';
import TemplateStudioGuard from './template-studio/components/TemplateStudioGuard';
import SpecialistMaterials from './pages/SpecialistMaterials';
import SpecialistMaterialNew from './pages/SpecialistMaterialNew';
import './styles/unified-docmarket-theme.css';

const { Pages, Layout } = pagesConfig;
const protectedPages = new Set(['Dashboard', 'MyDocuments', 'Profile']);

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const DosudebkaHome = Pages.Home;

const AuthenticatedApp = () => (
  <Routes>
    <Route path="/" element={<LayoutWrapper currentPageName="Market"><PlatformHome /></LayoutWrapper>} />
    <Route path="/market" element={<LayoutWrapper currentPageName="Market"><Market /></LayoutWrapper>} />
    <Route path="/reviews" element={<LayoutWrapper currentPageName="Reviews"><PlatformReviews /></LayoutWrapper>} />
    <Route path="/dosudebka" element={<LayoutWrapper currentPageName="Dosudebka"><DosudebkaHome /></LayoutWrapper>} />

    {Object.entries(Pages).filter(([path]) => !protectedPages.has(path) && path !== 'Home').map(([path, Page]) => (
      <Route key={path} path={`/${path}`} element={<LayoutWrapper currentPageName={path}><Page /></LayoutWrapper>} />
    ))}
    {Object.entries(Pages).filter(([path]) => protectedPages.has(path)).map(([path, Page]) => (
      <Route key={path} path={`/${path}`} element={<ProtectedRoute allowedRoles={['user', 'lawyer']}><LayoutWrapper currentPageName={path}><Page /></LayoutWrapper></ProtectedRoute>} />
    ))}
    <Route path="/Login" element={<LayoutWrapper currentPageName="Login"><Login /></LayoutWrapper>} />
    <Route path="/Register" element={<LayoutWrapper currentPageName="Register"><Register /></LayoutWrapper>} />
    <Route path="/RegisterLawyer" element={<LayoutWrapper currentPageName="RegisterLawyer"><RegisterLawyer /></LayoutWrapper>} />
    <Route path="/Forbidden" element={<LayoutWrapper currentPageName="Forbidden"><Forbidden /></LayoutWrapper>} />
    <Route path="/join/:roomId" element={<LayoutWrapper currentPageName="JoinRoom"><JoinRoom /></LayoutWrapper>} />
    <Route path="/ForLawyers" element={<LayoutWrapper currentPageName="ForLawyers"><ForLawyers /></LayoutWrapper>} />
    <Route path="/BusinessCabinet" element={<ProtectedRoute allowedRoles={['lawyer']}><LayoutWrapper currentPageName="BusinessCabinet"><BusinessCabinet /></LayoutWrapper></ProtectedRoute>} />
    <Route path="/market/offer/:offerId" element={<LayoutWrapper currentPageName="Market"><MarketOffer /></LayoutWrapper>} />
    <Route path="/market/specialist/:specialistId" element={<LayoutWrapper currentPageName="Market"><MarketSpecialist /></LayoutWrapper>} />
    <Route path="/market/favorites" element={<LayoutWrapper currentPageName="Market"><MarketFavorites /></LayoutWrapper>} />
    <Route path="/market/cart" element={<LayoutWrapper currentPageName="Market"><MarketCart /></LayoutWrapper>} />
    <Route path="/market/:direction" element={<LayoutWrapper currentPageName="Market"><Market /></LayoutWrapper>} />
    <Route path="/market/:direction/:section" element={<LayoutWrapper currentPageName="Market"><Market /></LayoutWrapper>} />
    <Route path="/market/:direction/:section/:category" element={<LayoutWrapper currentPageName="Market"><Market /></LayoutWrapper>} />
    <Route path="/market/:direction/:section/:category/:situation" element={<LayoutWrapper currentPageName="Market"><Market /></LayoutWrapper>} />
    <Route path="/market/:direction/:section/:category/:situation/offers" element={<LayoutWrapper currentPageName="Market"><Market /></LayoutWrapper>} />
    <Route path="/template-studio" element={<LayoutWrapper currentPageName="TemplateStudio"><TemplateStudioGuard><TemplateStudio /></TemplateStudioGuard></LayoutWrapper>} />
    <Route path="/template-studio/new" element={<LayoutWrapper currentPageName="TemplateStudio"><TemplateStudioGuard><TemplateStudioNew /></TemplateStudioGuard></LayoutWrapper>} />
    <Route path="/template-studio/:templateId/edit" element={<LayoutWrapper currentPageName="TemplateStudio"><TemplateStudioGuard><TemplateStudioEditor /></TemplateStudioGuard></LayoutWrapper>} />
    <Route path="/template-studio/:templateId/fill" element={<LayoutWrapper currentPageName="TemplateStudio"><TemplateStudioGuard><TemplateStudioFill /></TemplateStudioGuard></LayoutWrapper>} />
    <Route path="/specialist/materials" element={<ProtectedRoute allowedRoles={['lawyer']}><LayoutWrapper currentPageName="SpecialistMaterials"><SpecialistMaterials /></LayoutWrapper></ProtectedRoute>} />
    <Route path="/specialist/materials/new" element={<ProtectedRoute allowedRoles={['lawyer']}><LayoutWrapper currentPageName="SpecialistMaterials"><SpecialistMaterialNew /></LayoutWrapper></ProtectedRoute>} />
    <Route path="*" element={<PageNotFound />} />
  </Routes>
);

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router><ScrollToHash /><AuthenticatedApp /></Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
