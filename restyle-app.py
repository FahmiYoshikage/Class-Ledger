import os
import glob

# Base directory
BASE_DIR = '/home/fahmi/Documents/program/Class-Ledger/client/src'

# Find all JSX files
jsx_files = glob.glob(f'{BASE_DIR}/**/*.jsx', recursive=True)

# Replacements - order matters! More specific patterns first
replacements = [
    # Loading screen gradient
    ('bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500', 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'),
    ('bg-gradient-to-br from-indigo-50 to-purple-50', 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'),
    ('bg-gradient-to-br from-slate-50 to-indigo-50', 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'),
    ('bg-gradient-to-br from-gray-50', 'bg-gradient-to-br from-slate-900'),
    
    # Main background
    ('min-h-screen bg-gray-50', 'min-h-screen bg-slate-900'),
    ('min-h-screen bg-gray-100', 'min-h-screen bg-slate-900'),
    
    # Header/card backgrounds - specific patterns first
    ('bg-white rounded-2xl shadow-xl p-6', 'bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl p-6'),
    ('bg-white rounded-xl shadow-lg p-6', 'bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-lg p-6'),
    ('bg-white rounded-xl shadow-lg', 'bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-lg'),
    ('bg-white rounded-xl shadow-md', 'bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-md'),
    ('bg-white rounded-lg shadow-lg', 'bg-white/5 backdrop-blur-md border border-white/10 rounded-lg shadow-lg'),
    ('bg-white rounded-lg shadow-md', 'bg-white/5 backdrop-blur-md border border-white/10 rounded-lg shadow-md'),
    ('bg-white rounded-lg shadow', 'bg-white/5 backdrop-blur-md border border-white/10 rounded-lg shadow'),
    ('bg-white shadow-lg rounded-xl', 'bg-white/5 backdrop-blur-md border border-white/10 shadow-lg rounded-xl'),
    ('bg-white shadow-md rounded-xl', 'bg-white/5 backdrop-blur-md border border-white/10 shadow-md rounded-xl'),
    ('bg-white shadow-xl', 'bg-white/5 backdrop-blur-md border border-white/10 shadow-xl'),
    ('bg-white shadow-lg', 'bg-white/5 backdrop-blur-md border border-white/10 shadow-lg'),
    ('bg-white shadow-md', 'bg-white/5 backdrop-blur-md border border-white/10 shadow-md'),
    ('bg-white shadow', 'bg-white/5 backdrop-blur-md border border-white/10 shadow'),
    ('bg-white rounded-xl', 'bg-slate-800 border border-white/10 rounded-xl'),
    ('bg-white rounded-lg', 'bg-slate-800/50 border border-white/10 rounded-lg'),
    ('bg-white rounded', 'bg-slate-800/50 border border-white/10 rounded'),
    
    # Stats cards gradients - keep vibrant
    ('bg-gradient-to-br from-emerald-500 to-emerald-600', 'bg-gradient-to-br from-emerald-600 to-emerald-700'),
    ('bg-gradient-to-br from-blue-500 to-blue-600', 'bg-gradient-to-br from-sky-600 to-sky-700'),
    ('bg-gradient-to-br from-purple-500 to-purple-600', 'bg-gradient-to-br from-violet-600 to-violet-700'),
    ('bg-gradient-to-br from-amber-500 to-amber-600', 'bg-gradient-to-br from-amber-600 to-amber-700'),
    ('bg-gradient-to-br from-rose-500 to-rose-600', 'bg-gradient-to-br from-rose-600 to-rose-700'),
    ('bg-gradient-to-r from-emerald-500 to-teal-600', 'bg-gradient-to-r from-emerald-600 to-teal-700'),
    ('bg-gradient-to-r from-blue-500 to-purple-600', 'bg-gradient-to-r from-blue-600 to-purple-700'),
    
    # Tab styles
    ('bg-indigo-600 text-white', 'bg-emerald-600 text-white'),
    ('bg-indigo-500 text-white', 'bg-emerald-500 text-white'),
    ('text-gray-600 hover:bg-gray-100', 'text-slate-300 hover:bg-white/10'),
    ('text-gray-600 hover:bg-gray-50', 'text-slate-300 hover:bg-white/5'),
    
    # Search input and form controls
    ('border border-gray-200', 'border border-white/10 bg-white/5 text-white'),
    ('border-gray-200', 'border-white/10'),
    ('border-gray-300', 'border-white/10'),
    ('focus:border-indigo-500 focus:ring-indigo-500', 'focus:border-emerald-500 focus:ring-emerald-500'),
    ('focus:border-indigo-500', 'focus:border-emerald-500'),
    ('focus:ring-indigo-500', 'focus:ring-emerald-500'),
    
    # Filter selects
    ('bg-gray-50 border-gray-200', 'bg-white/5 border-white/10 text-white'),
    ('text-gray-500 bg-gray-50', 'text-slate-400 bg-white/5'),
    
    # Table headers
    ('bg-gray-50', 'bg-white/5'),
    ('bg-gray-100', 'bg-white/10'),
    
    # Text colors - specific to general
    ('text-3xl font-bold text-gray-900', 'text-3xl font-bold text-white'),
    ('text-2xl font-bold text-gray-900', 'text-2xl font-bold text-white'),
    ('text-xl font-bold text-gray-900', 'text-xl font-bold text-white'),
    ('text-lg font-bold text-gray-900', 'text-lg font-bold text-white'),
    ('text-xl font-semibold text-gray-900', 'text-xl font-semibold text-white'),
    ('text-lg font-semibold text-gray-900', 'text-lg font-semibold text-white'),
    ('font-semibold text-gray-900', 'font-semibold text-white'),
    ('font-medium text-gray-900', 'font-medium text-white'),
    ('text-gray-500 uppercase', 'text-slate-400 uppercase'),
    ('text-gray-900', 'text-white'),
    ('text-gray-800', 'text-slate-200'),
    ('text-gray-700', 'text-slate-300'),
    ('text-gray-600', 'text-slate-300'),
    ('text-gray-500', 'text-slate-400'),
    ('text-gray-400', 'text-slate-500'),
    
    # Table rows
    ('hover:bg-gray-50', 'hover:bg-white/5'),
    ('hover:bg-gray-100', 'hover:bg-white/10'),
    
    # Badges - status colors
    ('bg-green-100 text-green-800', 'bg-emerald-500/20 text-emerald-300'),
    ('bg-green-100 text-green-700', 'bg-emerald-500/20 text-emerald-300'),
    ('bg-green-50 text-green-700', 'bg-emerald-500/20 text-emerald-300'),
    ('bg-yellow-100 text-yellow-800', 'bg-amber-500/20 text-amber-300'),
    ('bg-yellow-100 text-yellow-700', 'bg-amber-500/20 text-amber-300'),
    ('bg-yellow-50 text-yellow-700', 'bg-amber-500/20 text-amber-300'),
    ('bg-red-100 text-red-800', 'bg-rose-500/20 text-rose-300'),
    ('bg-red-100 text-red-700', 'bg-rose-500/20 text-rose-300'),
    ('bg-red-50 text-red-700', 'bg-rose-500/20 text-rose-300'),
    ('bg-gray-100 text-gray-800', 'bg-slate-500/20 text-slate-300'),
    ('bg-gray-100 text-gray-700', 'bg-slate-500/20 text-slate-300'),
    ('bg-blue-100 text-blue-800', 'bg-sky-500/20 text-sky-300'),
    ('bg-blue-100 text-blue-700', 'bg-sky-500/20 text-sky-300'),
    ('bg-blue-50 text-blue-700', 'bg-sky-500/20 text-sky-300'),
    ('bg-purple-100 text-purple-800', 'bg-violet-500/20 text-violet-300'),
    ('bg-purple-100 text-purple-700', 'bg-violet-500/20 text-violet-300'),
    ('bg-indigo-100 text-indigo-800', 'bg-indigo-500/20 text-indigo-300'),
    ('bg-indigo-100 text-indigo-700', 'bg-indigo-500/20 text-indigo-300'),
    ('bg-orange-100 text-orange-800', 'bg-orange-500/20 text-orange-300'),
    ('bg-orange-100 text-orange-700', 'bg-orange-500/20 text-orange-300'),
    ('bg-teal-100 text-teal-800', 'bg-teal-500/20 text-teal-300'),
    
    # Buttons
    ('bg-indigo-600 hover:bg-indigo-700', 'bg-emerald-600 hover:bg-emerald-700'),
    ('bg-indigo-500 hover:bg-indigo-600', 'bg-emerald-500 hover:bg-emerald-600'),
    ('bg-blue-600 hover:bg-blue-700', 'bg-sky-600 hover:bg-sky-700'),
    ('bg-blue-500 hover:bg-blue-600', 'bg-sky-500 hover:bg-sky-600'),
    ('text-indigo-600 hover:', 'text-emerald-400 hover:'),
    ('text-indigo-600', 'text-emerald-400'),
    ('text-indigo-500', 'text-emerald-400'),
    ('text-blue-600', 'text-sky-400'),
    ('text-blue-500', 'text-sky-400'),
    
    # Rings
    ('ring-indigo-500', 'ring-emerald-500'),
    ('ring-blue-500', 'ring-sky-500'),
    
    # Modal overlays
    ('bg-black bg-opacity-50', 'bg-black/60 backdrop-blur-sm'),
    ('bg-black bg-opacity-40', 'bg-black/50 backdrop-blur-sm'),
    ('bg-black/50', 'bg-black/60 backdrop-blur-sm'),
    
    # Form inputs - modal specific
    ('bg-white border-gray-300', 'bg-slate-700 border-slate-600 text-white'),
    ('block w-full rounded-lg border-gray-300', 'block w-full rounded-lg border-slate-600 bg-slate-700 text-white'),
    ('block w-full rounded-md border-gray-300', 'block w-full rounded-md border-slate-600 bg-slate-700 text-white'),
    
    # Labels
    ('block text-sm font-medium text-gray-700', 'block text-sm font-medium text-slate-300'),
    
    # Delete/action buttons
    ('text-red-600 hover:text-red-800', 'text-rose-400 hover:text-rose-300'),
    ('text-red-600 hover:text-red-700', 'text-rose-400 hover:text-rose-300'),
    ('text-red-500 hover:text-red-700', 'text-rose-400 hover:text-rose-300'),
    
    # Money colors
    ('text-emerald-600', 'text-emerald-400'),
    ('text-green-600', 'text-emerald-400'),
    ('text-rose-600', 'text-rose-400'),
    ('text-red-600', 'text-rose-400'),
    
    # Table borders
    ('divide-gray-200', 'divide-white/10'),
    ('divide-gray-100', 'divide-white/5'),
    
    # Navbar specific
    ('bg-white/80 backdrop-blur-md', 'bg-slate-900/80 backdrop-blur-md'),
    ('hover:bg-gray-100', 'hover:bg-white/10'),
    ('hover:text-gray-700', 'hover:text-white'),
    
    # Alert colors
    ('bg-green-50', 'bg-emerald-500/10'),
    ('bg-blue-50', 'bg-sky-500/10'),
    ('bg-yellow-50', 'bg-amber-500/10'),
    ('bg-red-50', 'bg-rose-500/10'),
    ('text-green-800', 'text-emerald-300'),
    ('text-green-700', 'text-emerald-300'),
    ('text-blue-800', 'text-sky-300'),
    ('text-blue-700', 'text-sky-300'),
    ('text-yellow-800', 'text-amber-300'),
    ('text-yellow-700', 'text-amber-300'),
    ('text-red-800', 'text-rose-300'),
    ('text-red-700', 'text-rose-300'),
    
    # Cleanup remaining bg-white
    ('bg-white p-', 'bg-slate-800 p-'),
    ('bg-white"', 'bg-slate-800/50 border border-white/10"'),
]

for filepath in jsx_files:
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        original = content
        for pattern, replacement in replacements:
            content = content.replace(pattern, replacement)
        
        if content != original:
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"Restyled: {os.path.basename(filepath)}")
        else:
            print(f"No changes: {os.path.basename(filepath)}")
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

print("\nAll files processed!")

