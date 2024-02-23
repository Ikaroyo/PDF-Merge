var dropZone = document.getElementById("drag-drop-zone");
var pdfFiles = [];

dropZone.addEventListener("dragover", handleDragOver, false);
dropZone.addEventListener("drop", handleFileDrop, false);

function handleDragOver(event) {
  event.stopPropagation();
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
}

function handleFileDrop(event) {
  event.stopPropagation();
  event.preventDefault();

  var files = event.dataTransfer.files;

  for (var i = 0; i < files.length; i++) {
    if (files[i].type === "application/pdf") {
      var isDuplicate = pdfFiles.some(function (pdfFile) {
        return pdfFile.name === files[i].name && pdfFile.size === files[i].size;
      });
      document.getElementById("delete-button").classList.remove("disabled");
      if (isDuplicate) {
        alert("El archivo " + files[i].name + " ya está en la lista.");
      } else {
        pdfFiles.push(files[i]);
      }
    }
  }

  updatePDFList();
}

function updatePDFList() {
  var pdfList = document.getElementById("pdf-list");
  pdfList.innerHTML = "";

  if (pdfFiles.length >= 2) {
    document.getElementById("merge-button").classList.remove("disabled");
    document.getElementById("sort-button").classList.remove("disabled");
  }

  if (pdfFiles.length >= 1) {
    document.getElementById("delete-button").classList.remove("disabled");
  }
  for (var i = 0; i < pdfFiles.length; i++) {
    var listItem = document.createElement("li");
    listItem.textContent = pdfFiles[i].name;
    pdfList.appendChild(listItem);
  }
  document.getElementById("pdf-count").textContent = pdfFiles.length;
}

function sortFilesByName() {
  pdfFiles.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });

  updatePDFList();
}

async function mergeAllPDFs() {
  const pdfDoc = await PDFLib.PDFDocument.create();

  for (let i = 0; i < pdfFiles.length; i++) {
    const donorPdfBytes = await pdfFiles[i].arrayBuffer();
    const donorPdfDoc = await PDFLib.PDFDocument.load(donorPdfBytes);

    for (let k = 0; k < donorPdfDoc.getPageCount(); k++) {
      const [donorPage] = await pdfDoc.copyPages(donorPdfDoc, [k]);
      pdfDoc.addPage(donorPage);
    }
  }

  const pdfDataUri = await pdfDoc.saveAsBase64({ dataUri: true });
  const data_pdf = pdfDataUri.substring(pdfDataUri.indexOf(",") + 1);

  // Aquí puedes hacer algo con el PDF fusionado, como abrirlo en una nueva ventana o guardarlo.
  // append a button to download the pdf

  downloadPDF(data_pdf);
}

function downloadPDF(data) {
  const link = document.createElement("a");
  link.href = `data:application/pdf;base64,${data}`;
  // link name dd-mm-yyyy-hh-mm-ss.pdf
  link.download = new Date().toISOString().slice(0, 19).replace("T", "-");
  link.download = link.click();
}

function deleteAllFiles() {
  pdfFiles = [];
  updatePDFList();
  document.getElementById("merge-button").classList.add("disabled");
  document.getElementById("sort-button").classList.add("disabled");
  document.getElementById("delete-button").classList.add("disabled");
  document.getElementById("pdf-list").innerHTML = "Aun no has subido archivos";
}

function loadFiles() {
  /* open file dialog */
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".pdf";
  fileInput.multiple = true;

  fileInput.addEventListener("change", function (event) {
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
      if (files[i].type === "application/pdf") {
        var isDuplicate = pdfFiles.some(function (pdfFile) {
          return (
            pdfFile.name === files[i].name && pdfFile.size === files[i].size
          );
        });

        if (isDuplicate) {
          alert("El archivo " + files[i].name + " ya está en la lista.");
        } else {
          pdfFiles.push(files[i]);
          document.getElementById("delete-button").classList.remove("disabled");
          if (pdfFiles.length >= 2) {
            document
              .getElementById("merge-button")
              .classList.remove("disabled");
            document.getElementById("sort-button").classList.remove("disabled");
          }
        }
      }
    }

    // Actualizar la lista de archivos PDF después de haber procesado todos los archivos seleccionados
    updatePDFList();
  });

  // Disparar el evento de clic para abrir el cuadro de diálogo de selección de archivos
  fileInput.click();
}

document
  .getElementById("sort-button")
  .addEventListener("click", sortFilesByName, false);
document
  .getElementById("merge-button")
  .addEventListener("click", mergeAllPDFs, false);

document
  .getElementById("delete-button")
  .addEventListener("click", deleteAllFiles, false);

document
  .getElementById("load-files")
  .addEventListener("click", loadFiles, false);
