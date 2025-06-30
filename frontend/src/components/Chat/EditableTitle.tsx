import React, { useState, useEffect } from "react";

interface EditableTitleProps {
    initialTitle: string;
    onSave: (newTitle: string) => void;
}

const EditableTitle: React.FC<EditableTitleProps> = ({
                                                         initialTitle,
                                                         onSave,
                                                     }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(initialTitle);

    useEffect(() => {
        setTitle(initialTitle);
    }, [initialTitle]);

    const handleSave = () => {
        const trimmedTitle = title.trim();
        setIsEditing(false); // Close editor regardless
        if (trimmedTitle && trimmedTitle !== initialTitle) {
            onSave(trimmedTitle);
        } else {
            setTitle(initialTitle); // Revert if empty or unchanged
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSave();
        } else if (e.key === "Escape") {
            setTitle(initialTitle);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                autoFocus
                className="w-full text-xl font-semibold bg-transparent border-b-2 outline-none border-primary"
            />
        );
    }

    return (
        <h2
            onClick={() => setIsEditing(true)}
            className="text-xl font-semibold truncate cursor-pointer"
            title="Click to edit"
        >
            {title}
        </h2>
    );
};

export default EditableTitle;
