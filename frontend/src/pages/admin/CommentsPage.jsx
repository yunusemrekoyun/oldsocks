import React, { useEffect, useState } from "react";
import api from "../../../api";
import {
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
  Button,
  IconButton,
} from "@material-tailwind/react";
import { TrashIcon, CheckIcon } from "@heroicons/react/24/outline";

export default function CommentsPage() {
  const [section, setSection] = useState("comments"); // comments or replies
  const [filter, setFilter] = useState("approved"); // approved or pending
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const path = section === "comments" ? "comments" : "replies";
      const approved = filter === "approved";
      const { data } = await api.get(`/${path}?approved=${approved}`);
      setItems(data);
    } catch (err) {
      console.error("Yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [section, filter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Silmek istediğinize emin misiniz?")) return;
    try {
      await api.delete(`/${section}/${id}`);
      fetchItems();
    } catch (err) {
      console.error("Silinemedi:", err);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/${section}/${id}/approve`);
      fetchItems();
    } catch (err) {
      console.error("Onaylanamadı:", err);
    }
  };

  return (
    <div>
      <h4 className="text-2xl mb-4">Yorum Yönetimi</h4>
      <Tabs value={section} onChange={(value) => setSection(value)}>
        <TabsHeader>
          <Tab value="comments">Yorumlar</Tab>
          <Tab value="replies">Yanıtlar</Tab>
        </TabsHeader>
        <TabsBody>
          <TabPanel value={section}>
            <div className="flex gap-4 mb-6">
              <Button
                size="sm"
                variant={filter === "approved" ? "filled" : "outlined"}
                onClick={() => setFilter("approved")}
              >
                Onaylanan
              </Button>
              <Button
                size="sm"
                variant={filter === "pending" ? "filled" : "outlined"}
                onClick={() => setFilter("pending")}
              >
                Onay Bekleyen
              </Button>
            </div>

            {loading ? (
              <div>Yükleniyor…</div>
            ) : (
              <ul className="space-y-4">
                {items.map((it) => (
                  <li
                    key={it._id}
                    className="p-4 bg-white rounded shadow flex justify-between items-start"
                  >
                    <div>
                      <p className="font-medium">
                        {it.author.firstName} {it.author.lastName}
                      </p>
                      <p className="text-sm mt-1">{it.text}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(it.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {filter === "pending" && (
                        <IconButton
                          variant="text"
                          color="green"
                          onClick={() => handleApprove(it._id)}
                        >
                          <CheckIcon className="h-5 w-5" />
                        </IconButton>
                      )}
                      <IconButton
                        variant="text"
                        color="red"
                        onClick={() => handleDelete(it._id)}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </IconButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabPanel>
        </TabsBody>
      </Tabs>
    </div>
  );
}
