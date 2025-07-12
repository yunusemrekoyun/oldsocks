import React from "react";
import BlogCommentItem from "./BlogCommentItem";
import c1 from "../../assets/blog/blog-comment/comment_1.png";
import c2 from "../../assets/blog/blog-comment/comment_2.png";
import c3 from "../../assets/blog/blog-comment/comment_3.png";

const comments = [
  {
    id: 1,
    avatar: c1,
    name: "Emily Blunt",
    date: "December 4, 2017 at 3:12 pm",
    text: "Multiply sea night grass fourth day sea lesser.",
  },
  {
    id: 2,
    avatar: c2,
    name: "John Doe",
    date: "December 5, 2017 at 2:10 pm",
    text: "Blessed give fish lesser bearing multiply.",
  },
  {
    id: 3,
    avatar: c3,
    name: "Jane Roe",
    date: "December 6, 2017 at 1:08 pm",
    text: "Very lesser sea fish grass night.",
  },
];

const BlogComments = () => (
  <div className="mt-12">
    <h4 className="text-xl font-semibold mb-6 text-[#0b0b0d]">
      {comments.length} Comments
    </h4>
    {comments.map((c) => (
      <BlogCommentItem key={c.id} {...c} />
    ))}
  </div>
);

export default BlogComments;
