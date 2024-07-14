const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const contentDisplay = document.getElementById('contentDisplay');
const languageSelect = document.getElementById('languageSelect');
const speakBtn = document.getElementById('speakBtn');
const pauseBtn = document.getElementById('pauseBtn');
const cancelBtn = document.getElementById('cancelBtn');
const fontSizeSlider = document.getElementById('fontSizeSlider');
const bgColorSelect = document.getElementById('bgColorSelect');
const fontColorSelect = document.getElementById('fontColorSelect');

let currentUtterance = null;
let isSpeaking = false;

function handleKeyboardNavigation(event) {
  const key = event.key.toLowerCase();

  if (key === 'arrowup') {
    increaseFontSize();
  } else if (key === 'arrowdown') {
    decreaseFontSize();
  } else if (key === 'arrowleft') {
    decreaseFontSize();
  } else if (key === 'arrowright') {
    increaseFontSize();
  } else if (key === ' ' || key === 'enter') {
    toggleSpeech();
  }
}

function increaseFontSize() {
  const currentFontSize = parseInt(contentDisplay.style.fontSize, 10) || 16;
  const newFontSize = Math.min(currentFontSize + 2, 100);
  contentDisplay.style.fontSize = `${newFontSize}px`;
}

function decreaseFontSize() {
  const currentFontSize = parseInt(contentDisplay.style.fontSize, 10) || 16;
  const newFontSize = Math.max(currentFontSize - 2, 12);
  contentDisplay.style.fontSize = `${newFontSize}px`;
}

function toggleSpeech() {
  if (isSpeaking) {
    pauseUtterance();
  } else {
    speakText();
  }
}

function speakText() {
  if (isSpeaking) {
    speechSynthesis.resume();
    return;
  }

  isSpeaking = true;

  const speech = new SpeechSynthesisUtterance();
  speech.text = contentDisplay.textContent;
  speech.lang = languageSelect.value;
  speech.onend = function () {
    console.log('Finished in ' + event.elapsedTime + ' seconds.');
    isSpeaking = false;
    currentUtterance = null;
  };
  speech.onerror = function (e) {
    console.error('Error speaking:', e);
    isSpeaking = false;
    currentUtterance = null;
  };

  currentUtterance = speech;
  speechSynthesis.speak(speech);
  console.log('Speaking...');
}

function pauseUtterance() {
  if (isSpeaking) {
    speechSynthesis.pause();
    isSpeaking = false;
  }
}

function cancelUtterance() {
  if (currentUtterance) {
    speechSynthesis.cancel();
    isSpeaking = false;
    currentUtterance = null;
  }
}

speechSynthesis.addEventListener('pause', () => {
  isSpeaking = false;
});

speechSynthesis.addEventListener('resume', () => {
  isSpeaking = true;
});

speakBtn.addEventListener('click', speakText);
pauseBtn.addEventListener('click', pauseUtterance);
cancelBtn.addEventListener('click', cancelUtterance);
document.addEventListener('keydown', handleKeyboardNavigation);

uploadForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const file = fileInput.files[0];
  if (!file) {
    alert('Please select a file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const arrayBuffer = e.target.result;

    if (file.type === 'application/pdf') {
      handlePdfUpload(arrayBuffer);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      handleDocxUpload(arrayBuffer);
    } else {
      alert('Invalid file format. Please upload a .docx or .pdf file.');
    }
  };
  reader.readAsArrayBuffer(file);
});

function handlePdfUpload(arrayBuffer) {
  pdfjsLib.getDocument({ data: arrayBuffer }).promise.then((pdf) => {
    let pdfText = '';
    const numPages = pdf.numPages;
    const getPageText = (pageNum) => {
      return pdf.getPage(pageNum).then((page) => {
        return page.getTextContent().then((textContent) => {
          textContent.items.forEach((item) => {
            pdfText += item.str + ' ';
          });
          if (pageNum < numPages) {
            return getPageText(pageNum + 1);
          } else {
            contentDisplay.textContent = pdfText;
          }
        });
      });
    };
    getPageText(1);
  });
}

function handleDocxUpload(arrayBuffer) {
  mammoth.extractRawText({ arrayBuffer: arrayBuffer })
    .then((result) => {
      const content = result.value;
      contentDisplay.textContent = content;
    })
    .catch((error) => {
      console.error('Error extracting content:', error);
    });
}

function changeBackgroundColor() {
  const selectedBgColor = bgColorSelect.value;
  contentDisplay.style.backgroundColor = selectedBgColor;
}

function changeFontColor() {
  const selectedFontColor = fontColorSelect.value;
  contentDisplay.style.color = selectedFontColor;
}

bgColorSelect.addEventListener('change', changeBackgroundColor);
fontColorSelect.addEventListener('change', changeFontColor);
fontSizeSlider.addEventListener('input', function () {
  const fontSize = fontSizeSlider.value + 'px';
  contentDisplay.style.fontSize = fontSize;
});
