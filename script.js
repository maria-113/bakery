/* North Star Bakery - Touchstone 4 JavaScript
   Feature 1 (products.html): Pre-Order List Builder with category filter
   Feature 2 (contact.html):  Form validation + pre-filled form
   Storage: localStorage (saved list, chosen filter, contact details)  */

"use strict";

/* ===================== DATA (arrays and objects) ===================== */

// Array of objects describing every product on the products page
const products = [
  { id: "sourdough-boule",     name: "Sourdough boule",                  category: "breads",   price: "$6 – $8" },
  { id: "wheat-sandwich-loaf", name: "Whole wheat sandwich loaf",        category: "breads",   price: "$5 – $7" },
  { id: "seeded-multigrain",   name: "Seeded multigrain",                category: "breads",   price: "$7 – $9" },
  { id: "butter-croissants",   name: "Butter croissants",                category: "pastries", price: "$3 – $4" },
  { id: "danishes-scones",     name: "Fruit danishes and scones",        category: "pastries", price: "$3 – $5" },
  { id: "cinnamon-rolls",      name: "Cinnamon rolls",                   category: "pastries", price: "$4 – $5" },
  { id: "everyday-cakes",      name: "Everyday cakes (6-inch to 8-inch)", category: "cakes",   price: "$25 – $45" },
  { id: "celebration-cakes",   name: "Celebration cakes",                category: "cakes",    price: "$50 – $120" },
  { id: "cupcakes",            name: "Cupcakes (half dozen)",            category: "cakes",    price: "$15 – $20" }
];

// Object holding the localStorage keys so they are never mistyped
const STORAGE_KEYS = {
  list: "northStarPreorderList",
  filter: "northStarCategoryFilter",
  contact: "northStarContactInfo"
};

// Object of validation limits used by the form checks
const LIMITS = {
  nameMin: 2,
  itemsMin: 10,
  itemsMax: 500,
  allergyMax: 300
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\d{3}-\d{3}-\d{4}$/;

/* ===================== STORAGE HELPERS ===================== */

// Read a value from localStorage (returns fallback if missing or blocked)
function loadFromStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? fallback : JSON.parse(stored);
  } catch (error) {
    return fallback;
  }
}

// Write a value to localStorage
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Could not save to localStorage:", error);
  }
}

function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn("Could not clear localStorage:", error);
  }
}

/* ===================== PRE-ORDER LIST LOGIC ===================== */

function getProduct(id) {
  return products.find(function (product) { return product.id === id; });
}

// Saved list is an array of product ids; ignore any ids that no longer exist
function getSavedList() {
  const saved = loadFromStorage(STORAGE_KEYS.list, []);
  return Array.isArray(saved) ? saved.filter(getProduct) : [];
}

function toggleItem(id) {
  const list = getSavedList();
  const position = list.indexOf(id);
  if (position === -1) {
    list.push(id);
  } else {
    list.splice(position, 1);
  }
  saveToStorage(STORAGE_KEYS.list, list);
  refreshProductsPage();
}

function removeItem(id) {
  const list = getSavedList().filter(function (itemId) { return itemId !== id; });
  saveToStorage(STORAGE_KEYS.list, list);
  refreshProductsPage();
}

function clearList() {
  removeFromStorage(STORAGE_KEYS.list);
  refreshProductsPage();
}

// Turns the saved list into text for the pre-order form
function listToText(list) {
  return list.map(function (id) {
    const product = getProduct(id);
    return "- 1 x " + product.name + " (" + product.price + ")";
  }).join("\n");
}

/* ===================== PRODUCTS PAGE ===================== */

// Add an "Add to my list" button to every product in the HTML
function addButtonsToProducts() {
  document.querySelectorAll("li[data-id]").forEach(function (item) {
    // keep the product name and price together on the left of the row
    const info = document.createElement("span");
    info.className = "product-info";
    while (item.firstChild) { info.appendChild(item.firstChild); }
    item.appendChild(info);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "add-btn";
    button.dataset.id = item.dataset.id;
    button.addEventListener("click", function () { toggleItem(item.dataset.id); });
    item.appendChild(button);
  });
}

// Update each button text/state to match the saved list
function updateButtons() {
  const list = getSavedList();
  document.querySelectorAll("li[data-id] .add-btn").forEach(function (button) {
    const isAdded = list.indexOf(button.dataset.id) !== -1;
    const name = getProduct(button.dataset.id).name;
    button.setAttribute("aria-pressed", String(isAdded));
    button.textContent = isAdded ? "Added (remove)" : "Add to my list";
    button.setAttribute("aria-label", (isAdded ? "Remove " : "Add ") + name + (isAdded ? " from" : " to") + " my list");
  });
}

// Redraw the "Your List" section
function renderList() {
  const list = getSavedList();
  const listElement = document.getElementById("preorder-items");
  const summary = document.getElementById("list-summary");
  listElement.innerHTML = "";

  if (list.length === 0) {
    summary.textContent = "Your list is empty. Add a product above to get started.";
    document.getElementById("clear-list").hidden = true;
    return;
  }

  summary.textContent = "You have " + list.length + (list.length === 1 ? " item" : " items") + " on your list.";
  document.getElementById("clear-list").hidden = false;

  list.forEach(function (id) {
    const product = getProduct(id);
    const li = document.createElement("li");
    const text = document.createElement("span");
    text.textContent = product.name + " (" + product.price + ")";
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "add-btn";
    removeButton.textContent = "Remove";
    removeButton.setAttribute("aria-label", "Remove " + product.name + " from my list");
    removeButton.addEventListener("click", function () { removeItem(id); });
    li.appendChild(text);
    li.appendChild(removeButton);
    listElement.appendChild(li);
  });
}

// Show only the chosen category (or everything)
function applyFilter(category) {
  document.querySelectorAll("section[data-category]").forEach(function (section) {
    section.hidden = !(category === "all" || section.dataset.category === category);
  });
}

function handleFilterChange(event) {
  const category = event.target.value;
  saveToStorage(STORAGE_KEYS.filter, category);   // remember the selected option
  applyFilter(category);
}

function refreshProductsPage() {
  updateButtons();
  renderList();
}

function initProductsPage() {
  addButtonsToProducts();

  const filter = document.getElementById("category-filter");
  const savedFilter = loadFromStorage(STORAGE_KEYS.filter, "all");
  const validOption = Array.from(filter.options).some(function (o) { return o.value === savedFilter; });
  filter.value = validOption ? savedFilter : "all";
  applyFilter(filter.value);
  filter.addEventListener("change", handleFilterChange);

  document.getElementById("clear-list").addEventListener("click", clearList);
  refreshProductsPage();
}

/* ===================== CONTACT PAGE: VALIDATION ===================== */

// Each validator returns an error message, or "" when the value is valid
const validators = {
  "name": function (value) {
    if (value.trim() === "") return "Please enter your full name.";
    if (value.trim().length < LIMITS.nameMin) return "Your name must be at least " + LIMITS.nameMin + " characters long.";
    return "";
  },
  "email": function (value) {
    if (value.trim() === "") return "Please enter your email address.";
    if (!EMAIL_PATTERN.test(value.trim())) return "Please enter a valid email address, such as name@example.com.";
    return "";
  },
  "phone": function (value) {
    if (value.trim() === "") return "";   // optional field
    if (!PHONE_PATTERN.test(value.trim())) return "Please use the format 555-123-4567, or leave this blank.";
    return "";
  },
  "request-type": function (value) {
    return value === "" ? "Please choose a request type." : "";
  },
  "pickup-date": function (value) {
    if (value === "") return "Please choose a pickup date.";
    if (value < todayString()) return "Pickup date cannot be in the past. Please choose today or a later date.";
    return "";
  },
  "item-details": function (value) {
    const length = value.trim().length;
    if (length === 0) return "Please tell us which items you would like.";
    if (length < LIMITS.itemsMin) return "Please add a little more detail (at least " + LIMITS.itemsMin + " characters). You have " + length + ".";
    if (length > LIMITS.itemsMax) return "Item details must be " + LIMITS.itemsMax + " characters or fewer. You have " + length + ".";
    return "";
  },
  "allergy-notes": function (value) {
    if (value.length > LIMITS.allergyMax) return "Allergy notes must be " + LIMITS.allergyMax + " characters or fewer. You have " + value.length + ".";
    return "";
  }
};

function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + month + "-" + day;
}

function showError(field, message) {
  const errorBox = document.getElementById(field.id + "-error");
  errorBox.textContent = message;
  field.setAttribute("aria-invalid", "true");
  field.setAttribute("aria-describedby", errorBox.id);
}

function clearError(field) {
  document.getElementById(field.id + "-error").textContent = "";
  field.removeAttribute("aria-invalid");
  field.removeAttribute("aria-describedby");
}

// Validate one field; returns true if valid
function validateField(field) {
  const message = validators[field.id](field.value);
  if (message) {
    showError(field, message);
    return false;
  }
  clearError(field);
  return true;
}

// Validate every field; focus the first one with a problem
function validateForm(form) {
  let firstInvalid = null;
  Object.keys(validators).forEach(function (id) {
    const field = form.querySelector("#" + id);
    if (!validateField(field) && firstInvalid === null) {
      firstInvalid = field;
    }
  });
  if (firstInvalid) firstInvalid.focus();
  return firstInvalid === null;
}

/* ===================== CONTACT PAGE: STORAGE + SUBMIT ===================== */

// Pre-fill name, email and phone from the last request
function prefillContactInfo(form) {
  const info = loadFromStorage(STORAGE_KEYS.contact, null);
  if (!info) return;
  ["name", "email", "phone"].forEach(function (id) {
    if (info[id]) form.querySelector("#" + id).value = info[id];
  });
}

// Pre-fill item details from the list saved on the products page
function prefillItemsFromList(form) {
  const list = getSavedList();
  const textarea = form.querySelector("#item-details");
  const note = document.getElementById("list-note");
  if (list.length === 0 || textarea.value.trim() !== "") {
    note.textContent = "";
    return;
  }
  textarea.value = listToText(list);
  note.textContent = "We added the " + list.length + (list.length === 1 ? " item" : " items") + " from your saved pre-order list. You can edit this text.";
}

function saveContactInfo(form) {
  saveToStorage(STORAGE_KEYS.contact, {
    name: form.querySelector("#name").value.trim(),
    email: form.querySelector("#email").value.trim(),
    phone: form.querySelector("#phone").value.trim()
  });
}

function showStatus(message, moveFocus) {
  const status = document.getElementById("form-status");
  status.textContent = message;
  status.className = message ? "form-status" : "";
  if (message && moveFocus) status.focus();
}

function handleSubmit(event) {
  event.preventDefault();               // always stop the default submit first
  const form = event.target;
  showStatus("", false);

  if (!validateForm(form)) {
    showStatus("Please fix the highlighted fields and try again. Your answers have been kept.", false);
    return;
  }

  const firstName = form.querySelector("#name").value.trim().split(" ")[0];
  saveContactInfo(form);
  removeFromStorage(STORAGE_KEYS.list);   // the list has been sent, so start fresh
  form.querySelector("#item-details").value = "";
  form.querySelector("#allergy-notes").value = "";
  form.querySelector("#request-type").value = "";
  form.querySelector("#pickup-date").value = "";
  document.getElementById("list-note").textContent = "";
  showStatus("Thank you, " + firstName + "! Your request was received. We will email you within one business day.", true);
}

function handleReset() {
  Object.keys(validators).forEach(function (id) { clearError(document.getElementById(id)); });
  document.getElementById("list-note").textContent = "";
  showStatus("", false);
}

function initContactPage() {
  const form = document.getElementById("preorder-form");
  form.querySelector("#pickup-date").min = todayString();

  prefillContactInfo(form);
  prefillItemsFromList(form);

  // Check each field when the user leaves it, and re-check while they fix errors
  Object.keys(validators).forEach(function (id) {
    const field = form.querySelector("#" + id);
    field.addEventListener("blur", function () { validateField(field); });
    field.addEventListener("input", function () {
      if (field.getAttribute("aria-invalid") === "true") validateField(field);
    });
  });

  // hide the "we added your list" note once the user edits the text
  form.querySelector("#item-details").addEventListener("input", function () {
    document.getElementById("list-note").textContent = "";
  });

  form.addEventListener("submit", handleSubmit);
  form.addEventListener("reset", handleReset);
}

/* ===================== START ===================== */

document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("planner")) initProductsPage();
  if (document.getElementById("preorder-form")) initContactPage();
});
