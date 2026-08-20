/**
 * pages.config.js - core page routing configuration.
 * DocMarket is the platform shell; Dosudebka remains a dedicated service at /dosudebka.
 */
import Generator from './pages/Generator';
import Guide from './pages/Guide';
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import Dashboard from './pages/PlatformDashboard';
import MyDocuments from './pages/MyDocuments';
import Profile from './pages/Profile';
import __Layout from './Layout.jsx';

export const PAGES = {
    "Generator": Generator,
    "Guide": Guide,
    "Home": Home,
    "Pricing": Pricing,
    "Dashboard": Dashboard,
    "MyDocuments": MyDocuments,
    "Profile": Profile,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};