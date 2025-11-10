import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout, selectAuth } from '../store/slices/authSlice'
import NotificationDropdown from './NotificationDropdown'
import AnimatedBackground from './AnimatedBackground'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Menu, X, User, LogOut, LayoutDashboard, Users, Briefcase, Settings, Sun, Moon } from 'lucide-react'
import { cn } from '../lib/utils'
import { useTheme } from '../contexts/ThemeContext'

function Layout() {
    const { user } = useSelector(selectAuth)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const { theme, toggleTheme } = useTheme()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const handleLogout = async () => {
        try {
            await dispatch(logout()).unwrap()
            navigate('/login')
        } catch (error) {
            navigate('/login')
        }
    }

    const isActive = (path) => location.pathname === path

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/leads', label: 'Leads', icon: Briefcase },
        ...(user?.role === 'Admin' || user?.role === 'Manager'
            ? [
                { path: '/users', label: 'Users', icon: Users },
                { path: '/integrations', label: 'Integrations', icon: Settings },
            ]
            : []),
    ]

    return (
        <div className="min-h-screen relative bg-background text-foreground">
            <AnimatedBackground />
            <div className="relative z-10">
                <nav className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            {/* Logo and Desktop Navigation */}
                            <div className="flex items-center">
                                <Link to="/" className="flex items-center space-x-2">
                                    <div className="h-8 w-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">CRM</span>
                                    </div>
                                    <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
                                        CRM System
                                    </span>
                                </Link>

                                {/* Desktop Navigation */}
                                <div className="hidden md:ml-10 md:flex md:space-x-1">
                                    {navItems.map((item) => {
                                        const Icon = item.icon
                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                className={cn(
                                                    'inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                                                    isActive(item.path)
                                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500'
                                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                                                )}
                                            >
                                                <Icon className="mr-2 h-4 w-4" />
                                                {item.label}
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Right Side - User Info & Actions */}
                            <div className="flex items-center space-x-2 sm:space-x-4">
                                {/* Theme Toggle Button */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleTheme}
                                    className="h-9 w-9"
                                    aria-label="Toggle theme"
                                >
                                    {theme === 'dark' ? (
                                        <Sun className="h-5 w-5" />
                                    ) : (
                                        <Moon className="h-5 w-5" />
                                    )}
                                </Button>

                                {/* Notification Dropdown */}
                                <div className="hidden sm:block">
                                    <NotificationDropdown />
                                </div>

                                {/* User Dropdown Menu */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="flex items-center space-x-2 h-auto py-2 px-3"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="hidden sm:block text-left">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {user?.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
                                                </div>
                                            </div>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                                        <DropdownMenuLabel className="text-gray-900 dark:text-white">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium">{user?.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Logout</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Mobile Menu Button */}
                                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                                    <SheetTrigger asChild>
                                        <Button variant="ghost" size="icon" className="md:hidden">
                                            <Menu className="h-6 w-6" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                                        <div className="flex flex-col h-full">
                                            {/* Mobile Header */}
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center space-x-2">
                                                    <div className="h-8 w-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
                                                        <span className="text-white font-bold text-sm">CRM</span>
                                                    </div>
                                                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                                                        CRM System
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setMobileMenuOpen(false)}
                                                >
                                                    <X className="h-5 w-5" />
                                                </Button>
                                            </div>

                                            {/* Mobile User Info */}
                                            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {user?.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mobile Navigation */}
                                            <nav className="flex-1 space-y-1">
                                                {navItems.map((item) => {
                                                    const Icon = item.icon
                                                    return (
                                                        <Link
                                                            key={item.path}
                                                            to={item.path}
                                                            onClick={() => setMobileMenuOpen(false)}
                                                            className={cn(
                                                                'flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                                                                isActive(item.path)
                                                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                                            )}
                                                        >
                                                            <Icon className="mr-3 h-5 w-5" />
                                                            {item.label}
                                                        </Link>
                                                    )
                                                })}
                                            </nav>

                                            {/* Mobile Theme Toggle */}
                                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start"
                                                    onClick={toggleTheme}
                                                >
                                                    {theme === 'dark' ? (
                                                        <>
                                                            <Sun className="mr-2 h-4 w-4" />
                                                            Light Mode
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Moon className="mr-2 h-4 w-4" />
                                                            Dark Mode
                                                        </>
                                                    )}
                                                </Button>
                                            </div>

                                            {/* Mobile Notifications */}
                                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                <NotificationDropdown />
                                            </div>

                                            {/* Mobile Logout */}
                                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start"
                                                    onClick={handleLogout}
                                                >
                                                    <LogOut className="mr-2 h-4 w-4" />
                                                    Logout
                                                </Button>
                                            </div>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default Layout
