// ===== SERVICE WORKER REGISTRATION =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('sw.js').then(function(registration) {
            console.log('ServiceWorker registration successful');
        }, function(err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

// ===== DOM REFS =====
var dropArea = document.getElementById('drop-area');
var fileInput = document.getElementById('file-input');
var outputList = document.getElementById('output-list');
var downloadAllBar = document.getElementById('download-all-bar');
var downloadAllBtn = document.getElementById('download-all-btn');
var saveDropboxBtn = document.getElementById('save-dropbox-btn');
var saveDriveBtn = document.getElementById('save-drive-btn');
var totalCountEl = document.getElementById('total-count');
var totalSavingsEl = document.getElementById('total-savings');
var hippoImg = document.getElementById('hippo-img');
var clearAllBtn = document.getElementById('clear-all-btn');
var autoConvertToggle = document.getElementById('auto-convert-toggle');
var formatSelector = document.getElementById('format-selector');
var formatBtns = document.querySelectorAll('.format-btn:not(.select-all)');
var selectAllBtn = document.getElementById('select-all-formats');

var shareTwitter = document.getElementById('share-twitter');
var shareLinkedin = document.getElementById('share-linkedin');

// Legal & Compliance Refs
var modalLegal = document.getElementById('modal-legal');
var closeLegal = document.getElementById('close-legal');
var legalContent = document.getElementById('legal-content');
var cookieBanner = document.getElementById('cookie-banner');
var acceptCookies = document.getElementById('accept-cookies');

var linkAbout = document.getElementById('link-about');
var linkPrivacy = document.getElementById('link-privacy');
var linkTerms = document.getElementById('link-terms');
var linkContact = document.getElementById('link-contact');
var cookiePrivacyLink = document.getElementById('cookie-privacy-link');

var navAbout = document.getElementById('nav-about');
var navContact = document.getElementById('nav-contact');

var themeToggle = document.getElementById('theme-toggle');
var sunIcon = themeToggle.querySelector('.sun-icon');
var moonIcon = themeToggle.querySelector('.moon-icon');

// Custom Language Dropdown Refs
var langDropdown = document.getElementById('lang-dropdown');
var langTrigger = document.getElementById('lang-trigger');
var langMenu = document.getElementById('lang-menu');
var langItems = document.querySelectorAll('.dropdown-item');
var currentLangText = document.getElementById('current-lang-text');

// Force Header Visibility on scroll/interaction
window.addEventListener('scroll', function() {
    var header = document.getElementById('site-header');
    if (header) {
        header.style.position = 'fixed';
        header.style.top = '0';
        header.style.display = 'flex';
    }
}, {passive: true});

// ===== STATE =====
var compressedFiles = [];
var pendingCount = 0;
var doneCount = 0;
var totalOriginalBytes = 0;
var totalCompressedBytes = 0;

// ===== LEGAL & COMPLIANCE LOGIC =====
var legalData = {
    about: `<h2>About HipoPNG.com</h2><p>HipoPNG.com is a completely free, browser-based image optimization tool. We believe that everyone should have access to professional-grade image compression without the hassle of accounts or subscriptions.</p><p>Our mission is to make the web faster by helping developers and designers shrink their images with minimal loss in quality.</p>`,
    privacy: `<h2>Privacy Policy</h2><p>At HipoPNG.com, your privacy is our top priority. We process all image compression locally within your web browser using modern web technologies. This means:</p><ul><li>Your original images never leave your computer.</li><li>We do not store your images on our servers.</li><li>No personal data is collected from your uploaded files.</li></ul><p>We use essential cookies to improve your experience and analyze basic site traffic through Google Analytics.</p>`,
    terms: `<h2>Terms of Service</h2><p>By using HipoPNG.com, you agree to use our service for lawful purposes. You are solely responsible for the images you upload. Our service is provided "as is" without any warranties.</p><p>We reserve the right to update or modify these terms at any time.</p>`,
    contact: `<h2>Contact Us</h2>
              <p>Have questions or feedback? We'd love to hear from you!</p>
              <form id="contact-form" style="margin-top:20px; display:flex; flex-direction:column; gap:15px;">
                <input type="text" placeholder="Your Name" required>
                <input type="email" placeholder="Your Email" required>
                <textarea placeholder="Your Message" rows="4" required></textarea>
                <button type="submit" class="pro-btn" style="width:auto; align-self:flex-start; padding:12px 30px;">Send Message</button>
              </form>`
};

function showLegal(type) {
    legalContent.innerHTML = legalData[type] || '';
    modalLegal.style.display = 'flex';
    
    if (type === 'contact') {
        var form = document.getElementById('contact-form');
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Thank you! Your message has been sent (simulated).');
            modalLegal.style.display = 'none';
        });
    }
}

linkAbout.addEventListener('click', function(e) { e.preventDefault(); showLegal('about'); });
linkPrivacy.addEventListener('click', function(e) { e.preventDefault(); showLegal('privacy'); });
linkTerms.addEventListener('click', function(e) { e.preventDefault(); showLegal('terms'); });
linkContact.addEventListener('click', function(e) { e.preventDefault(); showLegal('contact'); });
cookiePrivacyLink.addEventListener('click', function(e) { e.preventDefault(); showLegal('privacy'); });

// Top Navigation Handlers
navAbout.addEventListener('click', function(e) {
    e.preventDefault();
    showLegal('about');
});

navContact.addEventListener('click', function(e) {
    e.preventDefault();
    showLegal('contact');
});

closeLegal.addEventListener('click', function() {
    modalLegal.style.display = 'none';
});

window.addEventListener('click', function(e) {
    if (e.target === modalLegal) modalLegal.style.display = 'none';
});

// Cookie Banner Logic
if (!localStorage.getItem('cookiesAccepted')) {
    cookieBanner.style.display = 'block';
}

acceptCookies.addEventListener('click', function() {
    localStorage.setItem('cookiesAccepted', 'true');
    cookieBanner.style.display = 'none';
});

// Theme Toggle Logic
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    }
}

var currentTheme = localStorage.getItem('theme') || 'light';
setTheme(currentTheme);

themeToggle.addEventListener('click', function() {
    var newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
});

// Language Switcher Logic
var translations = {
    en: {
        label: "English",
        hero_h1: "Smart WebP, PNG and JPEG compression",
        hero_p: "Optimize your images with a perfect balance in quality and file size.",
        drop_text: "Drop your WebP, PNG or JPEG files here!",
        drop_hint: "Unlimited images, completely free."
    },
    es: {
        label: "Español",
        hero_h1: "Compresión inteligente de WebP, PNG y JPEG",
        hero_p: "Optimiza tus imágenes con un equilibrio perfecto entre calidad y tamaño.",
        drop_text: "¡Suelta tus archivos WebP, PNG o JPEG aquí!",
        drop_hint: "Imágenes ilimitadas, completamente gratis."
    },
    zh: {
        label: "中文",
        hero_h1: "智能 WebP、PNG 和 JPEG 压缩",
        hero_p: "在质量和文件大小之间实现完美平衡，优化您的图像。",
        drop_text: "将您的 WebP、PNG 或 JPEG 文件拖到这里！",
        drop_hint: "无限数量，完全免费。"
    },
    fr: {
        label: "Français",
        hero_h1: "Compression intelligente WebP, PNG et JPEG",
        hero_p: "Optimisez vos images avec un équilibre parfait entre qualité et taille de fichier.",
        drop_text: "Déposez vos fichiers WebP, PNG ou JPEG ici !",
        drop_hint: "Images illimitées, complètement gratuit."
    },
    de: {
        label: "Deutsch",
        hero_h1: "Intelligente WebP-, PNG- und JPEG-Kompression",
        hero_p: "Optimieren Sie Ihre Bilder mit einer perfekten Balance aus Qualität und Dateigröße.",
        drop_text: "Ziehen Sie Ihre WebP-, PNG- oder JPEG-Dateien hierher!",
        drop_hint: "Unbegrenzte Bilder, völlig kostenlos."
    }
};

// Toggle dropdown
langTrigger.addEventListener('click', function(e) {
    e.stopPropagation();
    langDropdown.classList.toggle('open');
});

// Close dropdown when clicking outside
window.addEventListener('click', function() {
    langDropdown.classList.remove('open');
});

// Handle item selection
langItems.forEach(function(item) {
    item.addEventListener('click', function(e) {
        e.stopPropagation();
        var lang = this.getAttribute('data-value');
        localStorage.setItem('lang', lang);
        applyTranslation(lang);
        langDropdown.classList.remove('open');
    });
});

function applyTranslation(lang) {
    var t = translations[lang] || translations.en;
    
    // Update UI text
    document.querySelector('.hero-content h1').innerText = t.hero_h1;
    document.querySelector('.hero-subtext').innerText = t.hero_p;
    document.querySelector('.upload-text').innerText = t.drop_text;
    document.querySelector('.upload-hint').innerText = t.drop_hint;
    
    // Update dropdown state
    currentLangText.innerText = t.label;
    langItems.forEach(function(item) {
        if (item.getAttribute('data-value') === lang) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

var savedLang = localStorage.getItem('lang') || 'en';
applyTranslation(savedLang);

// Social Share Handlers
shareTwitter.addEventListener('click', function(e) {
    e.preventDefault();
    var text = "I just saved " + totalSavingsEl.innerText.match(/\d+%/)[0] + " on my images with HipoPNG.com! 🦛⚡";
    window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(window.location.href), "_blank");
});

shareLinkedin.addEventListener('click', function(e) {
    e.preventDefault();
    window.open("https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(window.location.href), "_blank");
});

// ===== FULL SCREEN DROPZONE =====
var fullScreenOverlay = document.createElement('div');
fullScreenOverlay.className = 'dropzone-fullscreen';
fullScreenOverlay.innerHTML = '<h2>Drop images anywhere!</h2>';
document.body.appendChild(fullScreenOverlay);

window.addEventListener('dragenter', function(e) {
    fullScreenOverlay.style.display = 'flex';
});

fullScreenOverlay.addEventListener('dragover', function(e) {
    e.preventDefault();
});

fullScreenOverlay.addEventListener('dragleave', function(e) {
    // Only hide if we actually left the window
    if (e.relatedTarget === null) {
        fullScreenOverlay.style.display = 'none';
    }
});

fullScreenOverlay.addEventListener('drop', function(e) {
    e.preventDefault();
    fullScreenOverlay.style.display = 'none';
    handleFiles(e.dataTransfer.files);
});

// ===== AUTO CONVERT TOGGLE LOGIC =====
autoConvertToggle.addEventListener('change', function() {
    if (this.checked) {
        formatSelector.style.display = 'flex';
    } else {
        formatSelector.style.display = 'none';
    }
});

// Format Button Selection
formatBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
        // Toggle selection
        this.classList.toggle('active');
        // Ensure at least one is selected or handle as needed
    });
});

// Select All Formats
selectAllBtn.addEventListener('click', function() {
    formatBtns.forEach(function(btn) {
        btn.classList.add('active');
    });
});

// ===== CLEAR ALL LOGIC =====
clearAllBtn.addEventListener('click', function() {
    outputList.innerHTML = '';
    compressedFiles = [];
    pendingCount = 0;
    doneCount = 0;
    totalOriginalBytes = 0;
    totalCompressedBytes = 0;
    downloadAllBar.style.display = 'none';
});

// ===== DRAG & DROP =====
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function(evt) {
    dropArea.addEventListener(evt, function(e) {
        e.preventDefault();
        e.stopPropagation();
    }, false);
});

['dragenter', 'dragover'].forEach(function(evt) {
    dropArea.addEventListener(evt, function() {
        dropArea.classList.add('dragover');
    }, false);
});

['dragleave', 'drop'].forEach(function(evt) {
    dropArea.addEventListener(evt, function() {
        dropArea.classList.remove('dragover');
    }, false);
});

dropArea.addEventListener('drop', function(e) {
    handleFiles(e.dataTransfer.files);
}, false);

dropArea.addEventListener('click', function() {
    fileInput.click();
});

fileInput.addEventListener('change', function() {
    handleFiles(this.files);
    this.value = '';
});

// ===== HANDLE FILES =====
function handleFiles(fileList) {
    var files = [];
    for (var i = 0; i < fileList.length; i++) {
        // TinyPNG supports WebP, PNG, JPEG
        var type = fileList[i].type;
        if (type === 'image/png' || type === 'image/jpeg' || type === 'image/webp') {
            files.push(fileList[i]);
        }
    }
    
    if (files.length === 0) return;

    outputList.style.display = 'block';
    
    // Limits removed for completely free experience
    pendingCount += files.length;
    for (var j = 0; j < files.length; j++) {
        processFile(files[j]);
    }
}

// ===== FORMAT BYTES =====
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    var k = 1024;
    var sizes = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ===== PROCESS SINGLE FILE =====
function processFile(file) {
    var id = 'f' + Math.random().toString(36).substr(2, 9);

    var row = document.createElement('div');
    row.className = 'file-row';
    row.id = id;

    var thumbUrl = URL.createObjectURL(file);

    // Left: Thumbnail + Filename + Type Badge
    var left = document.createElement('div');
    left.className = 'file-left';
    var img = document.createElement('img');
    img.className = 'file-thumb';
    img.src = thumbUrl;
    
    var nameWrapper = document.createElement('div');
    nameWrapper.className = 'file-name-wrapper';
    
    var nameSpan = document.createElement('span');
    nameSpan.className = 'file-name';
    nameSpan.textContent = file.name;
    
    // Add file type badge
    var ext = file.name.split('.').pop().toLowerCase();
    var typeBadge = document.createElement('span');
    typeBadge.className = 'type-badge type-' + ext;
    typeBadge.textContent = ext;
    nameSpan.appendChild(typeBadge);
    
    left.appendChild(img);
    left.appendChild(nameSpan);

    // Center: Original Size + Progress Bar
    var center = document.createElement('div');
    center.className = 'file-center';
    var sizeOld = document.createElement('span');
    sizeOld.className = 'size-text';
    sizeOld.textContent = formatBytes(file.size);
    var track = document.createElement('div');
    track.className = 'progress-track';
    var fill = document.createElement('div');
    fill.className = 'progress-fill compressing';
    fill.id = 'bar-' + id;
    track.appendChild(fill);
    center.appendChild(sizeOld);
    center.appendChild(track);

    // Right: New Size + Savings Badge + Download Link
    var right = document.createElement('div');
    right.className = 'file-right';
    right.id = 'status-' + id;
    right.innerHTML = '<span class="size-text">Optimizing...</span>';

    row.appendChild(left);
    row.appendChild(center);
    row.appendChild(right);
    outputList.appendChild(row);

    /**
     * TinyPNG uses "Smart Lossy Compression".
     * For PNG: selective color quantization.
     * For JPEG: optimal compression.
     * We mimic this with balanced initialQuality and no resolution loss.
     */
    var options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: false,
        initialQuality: 0.6, // Slightly more aggressive for "TinyPNG" like savings
        alwaysKeepResolution: true
    };

    // Auto-convert logic (if enabled, convert to WebP)
    var finalFileType = file.type;
    var finalFileName = file.name;

    if (autoConvertToggle && autoConvertToggle.checked) {
        // Find selected formats
        var selectedFormats = [];
        formatBtns.forEach(function(btn) {
            if (btn.classList.contains('active')) {
                selectedFormats.push(btn.getAttribute('data-format'));
            }
        });

        // Default to webp if nothing selected but toggle is on
        var targetFormat = selectedFormats.length > 0 ? selectedFormats[0] : 'webp';

        // Map to mime type
        var mimeMap = {
            'webp': 'image/webp',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'avif': 'image/avif',
            'jxl': 'image/jxl'
        };

        if (file.type !== mimeMap[targetFormat]) {
            options.fileType = mimeMap[targetFormat];
            finalFileType = mimeMap[targetFormat];
            // Update extension
            var ext = targetFormat === 'jpeg' ? '.jpg' : '.' + targetFormat;
            finalFileName = file.name.replace(/\.[^/.]+$/, "") + ext;
        }
    }

    imageCompression(file, options).then(function(compressedBlob) {
        // Use the new filename if converted
        var fileNameToSave = finalFileName;
        compressedFiles.push({ blob: compressedBlob, name: fileNameToSave });

        var ratio = compressedBlob.size / file.size;
        var percent = Math.round((1 - ratio) * 100);
        var displayPercent = percent > 0 ? percent : 0;

        // Success State UI
        fill.classList.remove('compressing');
        fill.classList.add('done');
        fill.style.width = '100%'; // Full green bar like TinyPNG

        totalOriginalBytes += file.size;
        totalCompressedBytes += compressedBlob.size;

        var dlUrl = URL.createObjectURL(compressedBlob);
        right.innerHTML = '';

        // Final Size
        var sizeNew = document.createElement('span');
        sizeNew.className = 'size-text';
        sizeNew.textContent = formatBytes(compressedBlob.size);
        right.appendChild(sizeNew);

        // Savings badge (e.g. -82%)
        if (displayPercent > 0) {
            var badge = document.createElement('span');
            badge.className = 'savings-badge';
            badge.textContent = '-' + displayPercent + '%';
            right.appendChild(badge);
        } else {
            // Even if 0%, TinyPNG often shows something or just the file size
            // We'll show a "0%" or "Optimized" if it's very small
            var badge = document.createElement('span');
            badge.className = 'savings-badge';
            badge.style.background = '#ccc'; // Gray if no savings
            badge.textContent = '0%';
            right.appendChild(badge);
        }

        // Download individual link
        var dlLink = document.createElement('a');
        dlLink.className = 'download-link';
        dlLink.href = dlUrl;
        dlLink.download = 'tiny_' + fileNameToSave; // Use updated name
        dlLink.textContent = 'download';
        right.appendChild(dlLink);

        onFileComplete();

    }).catch(function(err) {
        console.error('Compression error:', err);
        fill.classList.remove('compressing');
        fill.classList.add('error');
        fill.style.width = '100%';
        right.innerHTML = '<span class="size-text" style="color:#f44336">Error</span>';
        onFileComplete();
    });
}

// ===== ON FILE COMPLETE =====
function onFileComplete() {
    doneCount++;
    if (doneCount >= pendingCount && compressedFiles.length > 0) {
        // Show summary bar
        downloadAllBar.style.display = 'flex';
        
        var countText = compressedFiles.length + ' image' + (compressedFiles.length > 1 ? 's' : '');
        totalCountEl.textContent = countText;
        
        var totalPercent = Math.round((1 - totalCompressedBytes / totalOriginalBytes) * 100);
        if (totalPercent > 0) {
            totalSavingsEl.innerHTML = ' finished. Saved <span class="total-savings">' + totalPercent + '%</span>';
            // Make hippo happy!
            if (hippoImg) {
                hippoImg.classList.add('hippo-happy');
                setTimeout(function() {
                    hippoImg.classList.remove('hippo-happy');
                }, 2000);
            }
        } else {
            totalSavingsEl.textContent = ' finished. Optimized.';
        }
    }
}

// ===== DOWNLOAD ALL AS ZIP =====
downloadAllBtn.addEventListener('click', function() {
    if (compressedFiles.length === 0) return;
    
    var originalBtnText = downloadAllBtn.textContent;
    downloadAllBtn.textContent = 'Zipping...';
    downloadAllBtn.disabled = true;

    var zip = new JSZip();
    for (var i = 0; i < compressedFiles.length; i++) {
        // Prefix with 'tiny_' like TinyPNG output
        zip.file('tiny_' + compressedFiles[i].name, compressedFiles[i].blob);
    }

    zip.generateAsync({ type: 'blob' }).then(function(content) {
        saveAs(content, 'hipopng_compressed.zip');
        downloadAllBtn.textContent = originalBtnText;
        downloadAllBtn.disabled = false;
    });
});

// ===== SAVE TO DROPBOX & DRIVE (WORKABLE LINKS) =====
saveDropboxBtn.href = "https://www.dropbox.com/home";
saveDriveBtn.href = "https://drive.google.com/drive/my-drive";
