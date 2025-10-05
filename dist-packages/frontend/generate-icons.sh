#!/bin/bash
# Create simple colored squares as placeholder icons
convert -size 64x64 xc:#2563eb pwa-64x64.png
convert -size 192x192 xc:#2563eb pwa-192x192.png
convert -size 512x512 xc:#2563eb pwa-512x512.png
convert -size 512x512 xc:#1e40af maskable-icon-512x512.png
echo "PWA icons created as colored squares (replace with proper icons later)"
