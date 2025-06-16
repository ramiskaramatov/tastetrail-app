// addRecipeView.js
import View from "./View.js";
import icons from "url:../../img/icons.svg";

class AddRecipeView extends View {
  _parentElement = document.querySelector(".upload");
  _message = "Recipe was successfully uploaded!";
  _errorMessage =
    "Invalid input: Please ensure all required fields are filled, and descriptions are provided for all ingredients.";

  _window = document.querySelector(".add-recipe-window");
  _overlay = document.querySelector(".overlay");
  _btnOpen = document.querySelector(".nav__btn--add-recipe");
  _btnClose = document.querySelector(".btn--close-modal");

  _btnAddIngredient = null;
  _ingredientsContainer = null;

  _ingredientCount = 0; // Tracks number of ingredient input fields
  _isEditing = false; // Flag to indicate if currently editing a recipe
  _currentRecipe = null; // Stores the recipe object if in edit mode

  constructor() {
    super();
    this._addHandlerShowWindow();
    this._addHandlerHideWindow();
  }

  /**
   * Toggles the visibility of the add/edit recipe window.
   * If a recipe object is provided, the form will be pre-filled for editing.
   * @param {Object | null} recipe - The recipe object to pre-fill the form, or null for a new recipe.
   */
  toggleWindow(recipe = null) {
    // Determine if we are opening the modal (it was hidden before)
    const isModalOpening = this._window.classList.contains("hidden");

    // If opening, we need to render the form (either empty or pre-filled)
    // If closing, we don't need to re-render
    if (isModalOpening) {
      this._isEditing = !!recipe; // Set editing flag based on whether a recipe was passed
      this._currentRecipe = recipe; // Store the recipe for pre-filling

      this.renderForm(recipe); // Render the form with or without pre-filled data
    }

    this._overlay.classList.toggle("hidden");
    this._window.classList.toggle("hidden");

    // Re-attach event listener for add ingredient button when modal opens
    // This needs to be done *after* renderForm() because the button is re-rendered
    if (isModalOpening) {
      this._btnAddIngredient = this._parentElement.querySelector(
        ".btn--add-ingredient"
      );
      this._ingredientsContainer = this._parentElement.querySelector(
        ".upload__ingredients-container"
      );
      if (this._btnAddIngredient) {
        this._btnAddIngredient.addEventListener(
          "click",
          this._addHandlerAddIngredient.bind(this)
        );
      }
    }
  }

  /**
   * Renders the recipe form, either empty or pre-filled with existing recipe data.
   * @param {Object | null} recipe - The recipe object to pre-fill, or null for an empty form.
   */
  renderForm(recipe = null) {
    this._ingredientCount = 0; // Reset count when rendering a new form
    const markup = this._generateFormMarkup(recipe);
    this._clear();
    this._parentElement.insertAdjacentHTML("afterbegin", markup);
  }

  _addHandlerShowWindow() {
    // When opening for a new recipe, explicitly pass null
    this._btnOpen.addEventListener("click", () => this.toggleWindow(null));
  }

  _addHandlerHideWindow() {
    this._btnClose.addEventListener("click", this.toggleWindow.bind(this));
    this._overlay.addEventListener("click", this.toggleWindow.bind(this));
  }

  _addHandlerAddIngredient(e) {
    e.preventDefault();
    this._ingredientCount++;
    const markup = this._generateIngredientInputMarkup(this._ingredientCount);
    if (this._ingredientsContainer) {
      this._ingredientsContainer.insertAdjacentHTML("beforeend", markup);
    }
  }

  /**
   * Adds an event listener for form submission.
   * Collects form data, performs validation, and passes it to the handler.
   * @param {function} handler - The handler function from the controller.
   * It will receive (newRecipeData, isEditingFlag, recipeIdForEditing).
   */
  addHandlerUpload(handler) {
    this._parentElement.addEventListener("submit", (e) => {
      e.preventDefault();
      const dataArr = [...new FormData(this._parentElement)];
      const data = Object.fromEntries(dataArr);

      // Validate cookingTime and servings for non-negativity
      const cookingTime = +data.cookingTime;
      const servings = +data.servings;

      if (cookingTime < 0 || servings < 0) {
        this.renderError(
          "Cooking time and servings cannot be negative numbers."
        );
        return;
      }

      const ingredients = [];
      // Collect all ingredient rows, including pre-filled ones and dynamically added ones
      const ingredientRows = this._parentElement.querySelectorAll(
        ".upload__ingredient-row"
      );
      ingredientRows.forEach((row, i) => {
        // Use querySelector within the row to get values of dynamically added inputs
        const quantity = row.querySelector(
          `input[name="ingredient-quantity-${i + 1}"]`
        )?.value;
        const unit = row.querySelector(
          `input[name="ingredient-unit-${i + 1}"]`
        )?.value;
        const description = row.querySelector(
          `input[name="ingredient-description-${i + 1}"]`
        )?.value;

        // Only add if at least one field in the row is not empty
        if (quantity || unit || description) {
          ingredients.push([
            quantity ? quantity.trim() : "",
            unit ? unit.trim() : "",
            description ? description.trim() : "",
          ]);
        }
      });

      const nonNullIngredients = ingredients.filter((ingArr) =>
        ingArr.some((el) => el !== "")
      );

      // Validate each non-empty ingredient: must have 3 parts, description must be non-empty, and quantity must be a non-negative number or empty
      const isValidIngredients = nonNullIngredients.every((ingArr) => {
        const [quantity, unit, description] = ingArr;
        const isQuantityValid =
          quantity === "" ||
          (!isNaN(Number(quantity)) && Number(quantity) >= 0);
        const isDescriptionValid = description !== ""; // Description cannot be empty

        return ingArr.length === 3 && isQuantityValid && isDescriptionValid;
      });

      if (!isValidIngredients) {
        this.renderError(this._errorMessage);
        return;
      }

      const formattedIngredients = nonNullIngredients.map((ingArr) => ({
        quantity: ingArr[0] === "" ? null : +ingArr[0],
        unit: ingArr[1],
        description: ingArr[2],
      }));

      const newRecipe = {
        title: data.title,
        sourceUrl: data.sourceUrl,
        image: data.image,
        publisher: data.publisher,
        cookingTime: cookingTime,
        servings: servings,
        ingredients: formattedIngredients,
      };

      // Pass newRecipe data, the editing flag, and the recipe ID (if editing) to the controller
      handler(newRecipe, this._isEditing, this._currentRecipe?.id);
    });
  }

  /**
   * Generates the HTML markup for a single ingredient input row.
   * @param {number} index - The index of the ingredient row.
   * @param {Object | null} ingredient - Optional ingredient object to pre-fill values.
   * @returns {string} The HTML markup for the ingredient row.
   */
  _generateIngredientInputMarkup(index, ingredient = null) {
    const quantity =
      ingredient?.quantity !== undefined && ingredient.quantity !== null
        ? ingredient.quantity
        : "";
    const unit = ingredient?.unit || "";
    const description = ingredient?.description || "";

    return `
      <div class="upload__ingredient-row" data-ingredient-index="${index}">
        <label>Ingredient ${index}</label>
        <input value="${quantity}" type="number" name="ingredient-quantity-${index}" placeholder="Quantity" class="upload__input--quantity" min="0"/>
        <input value="${unit}" type="text" name="ingredient-unit-${index}" placeholder="Unit (e.g., cups)" class="upload__input--unit"/>
        <input value="${description}" type="text" name="ingredient-description-${index}" placeholder="Description (e.g., flour)" class="upload__input--description" required/>
      </div>
    `;
  }

  /**
   * Generates the complete HTML markup for the recipe upload/edit form.
   * @param {Object | null} recipe - Optional recipe object to pre-fill form fields.
   * @returns {string} The complete HTML markup for the form.
   */
  _generateFormMarkup(recipe = null) {
    let initialIngredientsMarkup = "";
    // If editing a recipe with existing ingredients
    if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
      recipe.ingredients.forEach((ing, i) => {
        initialIngredientsMarkup += this._generateIngredientInputMarkup(
          i + 1,
          ing
        );
      });
      this._ingredientCount = recipe.ingredients.length;
    } else {
      // If adding a new recipe, provide 3 empty ingredient rows by default
      initialIngredientsMarkup = Array.from({ length: 3 }, (_, i) =>
        this._generateIngredientInputMarkup(i + 1)
      ).join("");
      this._ingredientCount = 3;
    }

    return `
      <div class="upload__column">
        <h3 class="upload__heading">Recipe data</h3>
        <label>Title</label>
        <input value="${
          recipe?.title || ""
        }" required name="title" type="text" />
        <label>URL</label>
        <input value="${
          recipe?.sourceUrl || ""
        }" required name="sourceUrl" type="text" />
        <label>Image URL</label>
        <input value="${
          recipe?.image || ""
        }" required name="image" type="text" />
        <label>Publisher</label>
        <input value="${
          recipe?.publisher || ""
        }" required name="publisher" type="text" />
        <label>Prep time</label>
        <input value="${
          recipe?.cookingTime || ""
        }" required name="cookingTime" type="number" min="0"/>
        <label>Servings</label>
        <input value="${
          recipe?.servings || ""
        }" required name="servings" type="number" min="0"/>
      </div>

      <div class="upload__column">
        <h3 class="upload__heading">Ingredients</h3>
        <div class="upload__ingredients-container">
          ${initialIngredientsMarkup}
        </div>
        <button type="button" class="btn--add-ingredient">Add Ingredient</button>
      </div>

      <button class="btn upload__btn">
        <svg>
          <use href="${icons}#icon-upload-cloud"></use>
        </svg>
        <span>${this._isEditing ? "UPDATE RECIPE" : "UPLOAD RECIPE"}</span>
      </button>
    `;
  }
}

export default new AddRecipeView();
