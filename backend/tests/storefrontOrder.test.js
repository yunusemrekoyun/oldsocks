const test = require("node:test");
const assert = require("node:assert/strict");
const StorefrontSettings = require("../models/StorefrontSettings");
const controller = require("../controllers/storefrontController");

const sections = {
  new: { heading: "Yeni", source: "latest", productIds: [], shuffle: false },
  featured: { heading: "Öne çıkan", source: "random", productIds: [], shuffle: false },
  popular: { heading: "Popüler", source: "random", productIds: [], shuffle: false },
};

function response() {
  return {
    statusCode: 200,
    set() { return this; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
}

test("eski vitrin kaydı sıra ve görünürlük alanı olmasa da tüm alanları gösterir", async () => {
  const originalFindOne = StorefrontSettings.findOne;
  StorefrontSettings.findOne = async () => ({ fontPreset: "classic", heroButtonOpacity: 30, sections });
  try {
    const res = response();
    await controller.getAdmin({}, res);
    assert.deepEqual(res.body.sectionOrder, ["new", "featured", "popular"]);
    assert.equal(res.body.sections.new.visible, true);
    assert.equal(res.body.sections.featured.visible, true);
    assert.equal(res.body.sections.popular.visible, true);
  } finally {
    StorefrontSettings.findOne = originalFindOne;
  }
});

test("vitrin sırası kaydedilir; eksik veya yinelenen alan reddedilir", async () => {
  const originalFindOne = StorefrontSettings.findOne;
  const originalUpdate = StorefrontSettings.findOneAndUpdate;
  let saved;
  StorefrontSettings.findOne = async () => ({ fontPreset: "classic", heroButtonOpacity: 30, sections });
  StorefrontSettings.findOneAndUpdate = async (_filter, update) => {
    saved = update.$set;
    return saved;
  };
  try {
    const body = {
      fontPreset: "classic",
      heroButtonOpacity: 30,
      sectionOrder: ["popular", "new", "featured"],
      sections: { ...sections, featured: { ...sections.featured, visible: false } },
    };
    const res = response();
    await controller.update({ body }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(saved.sectionOrder, body.sectionOrder);
    assert.deepEqual(res.body.sectionOrder, body.sectionOrder);
    assert.equal(saved.sections.featured.visible, false);
    assert.equal(res.body.sections.featured.visible, false);

    const invalid = response();
    await controller.update({ body: { ...body, sectionOrder: ["new", "new", "popular"] } }, invalid);
    assert.equal(invalid.statusCode, 400);
    assert.deepEqual(saved.sectionOrder, body.sectionOrder);
  } finally {
    StorefrontSettings.findOne = originalFindOne;
    StorefrontSettings.findOneAndUpdate = originalUpdate;
  }
});

test("eski yönetim sekmesi kaydederse gizli ürün alanı yeniden açılmaz", async () => {
  const originalFindOne = StorefrontSettings.findOne;
  const originalUpdate = StorefrontSettings.findOneAndUpdate;
  const hiddenSections = { ...sections, featured: { ...sections.featured, source: "category", categoryId: null, visible: false } };
  let saved;
  StorefrontSettings.findOne = async () => ({
    fontPreset: "classic",
    heroButtonOpacity: 30,
    sectionOrder: ["new", "featured", "popular"],
    sections: hiddenSections,
  });
  StorefrontSettings.findOneAndUpdate = async (_filter, update) => {
    saved = update.$set;
    return saved;
  };
  try {
    const hide = response();
    await controller.update({ body: {
      fontPreset: "classic",
      heroButtonOpacity: 30,
      sectionOrder: ["new", "featured", "popular"],
      sections: hiddenSections,
    } }, hide);
    assert.equal(hide.statusCode, 200);
    assert.equal(saved.sections.featured.categoryId, null);

    const res = response();
    await controller.update({ body: {
      fontPreset: "classic",
      heroButtonOpacity: 30,
      sectionOrder: ["new", "featured", "popular"],
      sections,
    } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(saved.sections.featured.visible, false);
  } finally {
    StorefrontSettings.findOne = originalFindOne;
    StorefrontSettings.findOneAndUpdate = originalUpdate;
  }
});
