class PDFManager {
  constructor() {
    this.dropZone = document.getElementById("drag-drop-zone");
    this.pdfFiles = [];
    this.initEventListeners();
  }

  initEventListeners() {
    this.dropZone.addEventListener(
      "dragover",
      this.handleDragOver.bind(this),
      false
    );
    this.dropZone.addEventListener(
      "drop",
      this.handleFileDrop.bind(this),
      false
    );

    this.toast = document.getElementById("toast");

    document
      .getElementById("sort-button")
      .addEventListener("click", this.sortFilesByName.bind(this), false);
    document
      .getElementById("merge-button")
      .addEventListener("click", this.mergeAllPDFs.bind(this), false);
    document
      .getElementById("delete-button")
      .addEventListener("click", this.deleteAllFiles.bind(this), false);
    document
      .getElementById("load-files")
      .addEventListener("click", this.loadFiles.bind(this), false);
  }

  handleDragOver(event) {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  async handleFileDrop(event) {
    event.stopPropagation();
    event.preventDefault();

    const files = event.dataTransfer.files;
    await this.processFiles(files);
  }

  async loadFiles() {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".pdf";
    fileInput.multiple = true;

    fileInput.addEventListener("change", async (event) => {
      const files = event.target.files;
      await this.processFiles(files);
    });

    fileInput.click();
  }

  async processFiles(files) {
    for (let i = 0; i < files.length; i++) {
      if (files[i].type === "application/pdf") {
        const isDuplicate = this.pdfFiles.some((pdfFile) => {
          return (
            pdfFile.name === files[i].name && pdfFile.size === files[i].size
          );
        });

        if (isDuplicate) {
          this.toastAdd(
            "El archivo " + files[i].name + " ya se encuentra en la lista"
          );
        } else {
          this.pdfFiles.push(files[i]);
          document.getElementById("delete-button").classList.remove("disabled");
          if (this.pdfFiles.length >= 2) {
            document
              .getElementById("merge-button")
              .classList.remove("disabled");
            document.getElementById("sort-button").classList.remove("disabled");
          }
        }
      }
    }

    this.updatePDFList();
  }

  toastAdd(text) {
    // create and show the toast
    console.log(text);

    const toast = document.createElement("div");
    toast.classList.add("toast");
    toast.textContent = text;

    document.body.appendChild(toast);

    // Calcula el retraso para mostrar el toast
    const delay = 300; // Milisegundos
    const existingToasts = document.querySelectorAll(".toast");
    const offsetY = existingToasts.length * (toast.offsetHeight + 20); // Ajusta según el espacio deseado entre los toast

    if (existingToasts.length > 0) {
      toast.style.top = `${offsetY}px`; // Establece la posición vertical del toast
    } else {
      toast.style.top = "0px"; // Establece la ubicación vertical del primer toast
    }

    // Establece un temporizador para mostrar el toast con el retraso calculado
    setTimeout(() => {
      toast.style.top = `${offsetY}px`; // Establece la posición vertical del toast
      toast.classList.add("show"); // Muestra el toast
    }, delay * existingToasts.length);

    // Establece otro temporizador para eliminar el toast después de cierto tiempo
    setTimeout(() => {
      // Mueve el toast hacia arriba y luego lo elimina
      toast.style.top = "-50px"; // Mueve el toast fuera de la pantalla
      toast.classList.remove("show"); // Oculta el toast

      // Elimina el toast después de la transición
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300); // Tiempo de la transición CSS
    }, delay * existingToasts.length + 3000); // 3000 milliseconds = 3 seconds
  }

  updatePDFList() {
    const pdfList = document.getElementById("pdf-list");
    pdfList.innerHTML = "";

    if (this.pdfFiles.length >= 2) {
      document.getElementById("merge-button").classList.remove("disabled");
      document.getElementById("sort-button").classList.remove("disabled");
    }

    if (this.pdfFiles.length >= 1) {
      document.getElementById("delete-button").classList.remove("disabled");
    }

    for (let i = 0; i < this.pdfFiles.length; i++) {
      const listItem = document.createElement("li");
      listItem.textContent = this.pdfFiles[i].name;
      pdfList.appendChild(listItem);
    }
    document.getElementById("pdf-count").textContent = this.pdfFiles.length;
  }

  async mergeAllPDFs() {
    const pdfDoc = await PDFLib.PDFDocument.create();

    for (let i = 0; i < this.pdfFiles.length; i++) {
      const donorPdfBytes = await this.pdfFiles[i].arrayBuffer();
      const donorPdfDoc = await PDFLib.PDFDocument.load(donorPdfBytes);

      for (let k = 0; k < donorPdfDoc.getPageCount(); k++) {
        const [donorPage] = await pdfDoc.copyPages(donorPdfDoc, [k]);
        pdfDoc.addPage(donorPage);
      }
    }

    const pdfDataUri = await pdfDoc.saveAsBase64({ dataUri: true });
    const data_pdf = pdfDataUri.substring(pdfDataUri.indexOf(",") + 1);

    // Generamos el nombre del archivo usando la fecha y hora actual
    const fileName =
      new Date().toISOString().slice(0, 19).replace("T", "-") + ".pdf";

    // Creamos un enlace de descarga y simulamos un clic para iniciar la descarga
    const link = document.createElement("a");
    link.href = "data:application/pdf;base64," + data_pdf;
    link.download = fileName;
    link.target = "_blank";
    link.click();
  }

  deleteAllFiles() {
    this.pdfFiles = [];
    this.updatePDFList();
    document.getElementById("merge-button").classList.add("disabled");
    document.getElementById("sort-button").classList.add("disabled");
    document.getElementById("delete-button").classList.add("disabled");
    document.getElementById("pdf-list").innerHTML =
      "Aun no has subido archivos";
  }

  sortFilesByName() {
    this.pdfFiles.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    this.updatePDFList();
  }
}

// Crear una instancia de la clase PDFManager
const pdfManager = new PDFManager();
