import express from 'express';
import open from 'open';
import { resolve } from 'path';

export async function getAlbumDetails(sourcePath, photos, defaultTitle) {
  return new Promise(async (resolvePromise, reject) => {
    const app = express();
    const port = 3333;

    app.use(express.json());
    app.use('/images', express.static(resolve(sourcePath)));

    app.get('/', async (req, res) => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Import Album: ${defaultTitle}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            .selected-cover { ring: 4px solid #f59e0b; }
            .selected-featured { ring: 4px solid #22c55e; }
            .cover-badge { display: none; }
            .selected-cover .cover-badge { display: block; }
            .featured-badge { display: none; }
            .selected-featured .featured-badge { display: block; }
          </style>
        </head>
        <body class="bg-gray-100 p-8">
          <div class="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6">
            <h1 class="text-3xl font-bold mb-6 text-gray-800">Import Album</h1>
            
            <form id="importForm" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Album Display Name</label>
                  <input type="text" id="displayName" value="${defaultTitle}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Description</label>
                  <textarea id="description" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500">A collection of photography</textarea>
                </div>
              </div>

              <div class="border-t pt-6">
                <h2 class="text-xl font-semibold mb-4">Select Photos</h2>
                <p class="text-gray-600 mb-4">
                  <span class="inline-block w-4 h-4 bg-amber-500 mr-1 rounded"></span> Click image to set as <strong>Cover</strong><br>
                  <span class="inline-block w-4 h-4 bg-green-500 mr-1 rounded"></span> Ctrl/Cmd+Click (or check box) to toggle <strong>Featured</strong>
                </p>
                
                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  ${photos.map((photo, index) => `
                    <div class="photo-card relative group cursor-pointer transition-all duration-200 rounded-lg overflow-hidden border-2 border-transparent"
                         data-filename="${photo.filename}"
                         onclick="handleImageClick(this, event)">
                      <img src="/images/${photo.filename}" class="w-full h-48 object-cover" loading="lazy">
                      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                      
                      <!-- Cover Badge -->
                      <div class="cover-badge absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded shadow-sm font-bold">
                        COVER
                      </div>
                      
                      <!-- Featured Badge -->
                      <div class="featured-badge absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded shadow-sm font-bold">
                        FEATURED
                      </div>

                      <div class="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs p-1 truncate text-center">
                        ${photo.filename}
                      </div>
                      
                      <div class="absolute bottom-8 right-2">
                        <input type="checkbox" class="featured-checkbox w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500" 
                               onclick="event.stopPropagation(); toggleFeatured(this.closest('.photo-card'))">
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </form>
          </div>

          <div class="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-50">
            <div class="max-w-7xl mx-auto flex justify-between items-center">
              <div class="text-sm text-gray-600">
                Selected Cover: <span id="selectedCoverName" class="font-bold text-gray-900">None</span> | 
                Featured: <span id="featuredCount" class="font-bold text-gray-900">0</span>
              </div>
              <button onclick="submitForm()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow-md transition-colors">
                Complete Import
              </button>
            </div>
          </div>
          
          <div class="h-20"></div> <!-- Spacer for fixed footer -->

          <script>
            let coverImage = null;
            let featuredImages = new Set();

            function handleImageClick(card, event) {
              if (event.ctrlKey || event.metaKey) {
                toggleFeatured(card);
              } else {
                setCover(card);
              }
            }

            function setCover(card) {
              // Remove previous cover
              document.querySelectorAll('.photo-card').forEach(c => {
                c.classList.remove('selected-cover');
              });
              
              card.classList.add('selected-cover');
              coverImage = card.dataset.filename;
              document.getElementById('selectedCoverName').textContent = coverImage;
            }

            function toggleFeatured(card) {
              const filename = card.dataset.filename;
              const checkbox = card.querySelector('.featured-checkbox');
              
              if (featuredImages.has(filename)) {
                featuredImages.delete(filename);
                card.classList.remove('selected-featured');
                checkbox.checked = false;
              } else {
                featuredImages.add(filename);
                card.classList.add('selected-featured');
                checkbox.checked = true;
              }
              document.getElementById('featuredCount').textContent = featuredImages.size;
            }

            async function submitForm() {
              if (!coverImage) {
                alert('Please select a cover image!');
                return;
              }

              const data = {
                displayName: document.getElementById('displayName').value,
                description: document.getElementById('description').value,
                coverImage: coverImage,
                featuredImages: Array.from(featuredImages)
              };

              try {
                const response = await fetch('/submit', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data)
                });
                
                if (response.ok) {
                  document.body.innerHTML = '<div class="flex items-center justify-center h-screen"><h1 class="text-4xl text-green-600">Import Confirmed! You can close this tab.</h1></div>';
                }
              } catch (e) {
                alert('Error submitting form: ' + e.message);
              }
            }
            
            // Set first image as cover by default
            const firstCard = document.querySelector('.photo-card');
            if (firstCard) {
              setCover(firstCard);
            }
          </script>
        </body>
        </html>
      `;
      res.send(html);
    });

    app.post('/submit', (req, res) => {
      res.json({ success: true });
      server.close();
      resolvePromise(req.body);
    });

    const server = app.listen(port, () => {
      console.log(`\n🚀 UI Server started at http://localhost:${port}`);
      open(`http://localhost:${port}`);
    });
  });
}

