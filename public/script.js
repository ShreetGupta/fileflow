function toggleTheme() {
  document.body.classList.toggle("dark");
}

function showSnackbar(message) {
  const sb = document.getElementById("snackbar");
  sb.innerText = message;
  sb.className = "show";
  setTimeout(() => sb.className = sb.className.replace("show", ""), 3000);
}

function showLoader(show) {
  document.getElementById("loader").style.display = show ? "flex" : "none";
}

/* Drag & Drop */
const imageDrop = document.getElementById("imageDrop");
const imageInput = document.getElementById("imageFiles");

imageDrop.addEventListener("click", () => imageInput.click());

imageDrop.addEventListener("dragover", e => {
  e.preventDefault();
  imageDrop.classList.add("dragover");
});

imageDrop.addEventListener("dragleave", () => {
  imageDrop.classList.remove("dragover");
});

imageDrop.addEventListener("drop", e => {
  e.preventDefault();
  imageDrop.classList.remove("dragover");
  imageInput.files = e.dataTransfer.files;
  previewImages();
});

imageInput.addEventListener("change", previewImages);

function previewImages() {
  const preview = document.getElementById("imagePreview");
  preview.innerHTML = "";
  for (let file of imageInput.files) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement("img");
      img.src = e.target.result;
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
}

/* Upload Images */
async function uploadImages() {
  const files = imageInput.files;
  const quality = document.getElementById("imageQuality").value;
  const format = document.getElementById("imageFormat").value;

  const formData = new FormData();
  for (let file of files) formData.append("files", file);
  formData.append("quality", quality);
  formData.append("format", format);

  showLoader(true);

  const res = await fetch("/process-image", { method: "POST", body: formData });
  const data = await res.json();

  showLoader(false);

  let output = "";
  data.forEach(file => {
    output += `<p>Saved ${file.saved}% 
    <a href="${file.file}" download>Download</a></p>`;
  });

  document.getElementById("imageResult").innerHTML = output;
  showSnackbar("Images Processed Successfully");
}

/* PDF */
async function uploadPDF() {
  const files = document.getElementById("pdfFiles").files;
  const formData = new FormData();
  for (let file of files) formData.append("files", file);

  showLoader(true);
  await fetch("/compress-pdf", { method: "POST", body: formData });
  showLoader(false);
  showSnackbar("PDF Compressed Successfully");
}

/* VIDEO */
async function uploadVideo() {
  const files = document.getElementById("videoFiles").files;
  const crf = document.getElementById("videoCrf").value;
  const format = document.getElementById("videoFormat").value;

  const formData = new FormData();
  for (let file of files) formData.append("files", file);
  formData.append("crf", crf);
  formData.append("format", format);

  showLoader(true);
  await fetch("/process-video", { method: "POST", body: formData });
  showLoader(false);
  showSnackbar("Video Converted Successfully");
}