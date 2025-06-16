import View from "./View.js";
import icons from "url:../../img/icons.svg";

class PaginationView extends View {
  _parentElement = document.querySelector(".pagination");

  addHandlerClick(handler) {
    this._parentElement.addEventListener("click", function (e) {
      const btn = e.target.closest(".btn--inline");
      if (!btn) return;
      const goToPage = +btn.dataset.goto;
      handler(goToPage);
    });
  }

  _generateMarkup() {
    const curPage = this._data.page;
    const numPages = Math.ceil(
      this._data.results.length / this._data.resultsPerPage
    );

    // Scenario 1: Only 1 page (no buttons needed)
    if (numPages <= 1) return "";

    const prevBtn = this._generatePrevButton(curPage);
    const nextBtn = this._generateNextButton(curPage, numPages);
    const pageNumbersMarkup = `<span class="pagination__pages">${curPage}/${numPages}</span>`;

    // Scenario 2: On page 1, and there are other pages
    if (curPage === 1 && numPages > 1) {
      return `
        ${pageNumbersMarkup}
        ${nextBtn}
      `;
    }

    // Scenario 3: On last page
    if (curPage === numPages && numPages > 1) {
      return `
        ${prevBtn}
        ${pageNumbersMarkup}
      `;
    }

    // Scenario 4: On a middle page
    if (curPage > 1 && curPage < numPages) {
      return `
        ${prevBtn}
        ${pageNumbersMarkup}
        ${nextBtn}
      `;
    }
  }

  _generatePrevButton(curPage) {
    if (curPage <= 1) return ""; // No previous button on the first page
    return `
      <button data-goto="${
        curPage - 1
      }"class="btn--inline pagination__btn--prev">
        <svg class="search__icon">
          <use href="${icons}#icon-arrow-left"></use>
        </svg>
        <span>Page ${curPage - 1}</span>
      </button>
    `;
  }

  _generateNextButton(curPage, numPages) {
    if (curPage >= numPages) return ""; // No next button on the last page
    return `
      <button data-goto="${
        curPage + 1
      }" class="btn--inline pagination__btn--next">
        <span>Page ${curPage + 1}</span>
        <svg class="search__icon">
          <use href="${icons}#icon-arrow-right"></use>
        </svg>
      </button>
    `;
  }
}

export default new PaginationView();
