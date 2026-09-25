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

test("eski vitrin kaydı sıralama alanı olmasa da varsayılan sırayla açılır", async () => {
  const originalFindOne = StorefrontSettings.findOne;
  StorefrontSettings.findOne = async () => ({ fontPreset: "classic", heroButtonOpacity: 30, sections });
  try {
    const res = response();
    await controller.getAdmin({}, res);
    assert.deepEqual(res.body.sectionOrder, ["new", "featured", "popular"]);
  } finally {
    StorefrontSettings.findOne = originalFindOne;
  }
});

test("vitrin sırası kaydedilir; eksik veya yinelenen alan reddedilir", async () => {
  const originalUpdate = StorefrontSettings.findOneAndUpdate;
  let saved;
  StorefrontSettings.findOneAndUpdate = async (_filter, update) => {
    saved = update.$set;
    return saved;
  };
  try {
    const body = {
      fontPreset: "classic",
      heroButtonOpacity: 30,
      sectionOrder: ["popular", "new", "featured"],
      sections,
    };
    const res = response();
    await controller.update({ body }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(saved.sectionOrder, body.sectionOrder);
    assert.deepEqual(res.body.sectionOrder, body.sectionOrder);

    const invalid = response();
    await controller.update({ body: { ...body, sectionOrder: ["new", "new", "popular"] } }, invalid);
    assert.equal(invalid.statusCode, 400);
    assert.deepEqual(saved.sectionOrder, body.sectionOrder);
  } finally {
    StorefrontSettings.findOneAndUpdate = originalUpdate;
  }
});
