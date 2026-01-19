import os

file_path = 'src/pages/LandingPage.css'
with open(file_path, 'a', encoding='utf-8') as f:
    f.write("""

/* Force update background */
.landing-page {
    background: linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.95)),
                url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=3840&auto=format&fit=crop') !important;
    background-size: cover !important;
    background-position: center !important;
    background-attachment: fixed !important;
    background-repeat: no-repeat !important;
    min-height: 100vh !important;
    background-color: transparent !important;
}

.hero-section {
    background: none !important;
}
""")
print("Appended CSS.")
