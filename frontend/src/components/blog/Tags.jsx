// src/components/Tags.jsx
import React from "react";
import TagItem from "./TagItem";

const tags = [
  "project",
  "love",
  "technology",
  "travel",
  "restaurant",
  "life style",
  "design",
  "illustration",
];

const Tags = () => (
  <div className="mb-8">
    <h4 className="text-lg font-semibold mb-3">Tags Clouds</h4>
    <div className="flex flex-wrap">
      {tags.map((t) => (
        <TagItem key={t} tag={t} />
      ))}
    </div>
  </div>
);

export default Tags;
