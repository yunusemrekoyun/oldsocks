import React, { useEffect, useState } from "react";
import api from "../../../api";
import TagItem from "./TagItem";

export default function Tags() {
  const [tags, setTags] = useState([]);

  useEffect(() => {
    api
      .get("/blogs/tags")
      .then(({ data }) => setTags(data))
      .catch((err) => console.error("Tags yüklenemedi:", err));
  }, []);

  if (!tags.length) return null;

  return (
    <div className="mb-8">
      <h4 className="text-lg font-semibold mb-3 text-[#0b0b0d]">Tags Clouds</h4>
      <div className="flex flex-wrap">
        {tags.map(({ tag, count }) => (
          <TagItem key={tag} tag={tag} count={count} />
        ))}
      </div>
    </div>
  );
}
