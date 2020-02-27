import * as React from "react";
import classNames from "clsx";
import { useThanosFront } from "lib/thanos/front";
import PageLayout from "app/layouts/PageLayout";
import Identicon from "app/atoms/Identicon";
import FormField from "app/atoms/FormField";
import { ReactComponent as EditIcon } from "app/icons/edit.svg";

const Explore: React.FC = () => {
  const { account, editAccountName } = useThanosFront();
  if (!account) {
    throw new Error("Explore page only allowed with existing Account");
  }

  const [editing, setEditing] = React.useState(false);

  const editAccNameFieldRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editing) {
      editAccNameFieldRef.current?.focus();
    }
  }, [editing]);

  const handleEditClick = React.useCallback(() => {
    setEditing(true);
  }, [setEditing]);

  const handleCancelClick = React.useCallback(() => {
    setEditing(false);
  }, [setEditing]);

  const handleSaveClick = React.useCallback(() => {
    const newName = editAccNameFieldRef.current?.value;
    if (newName && newName !== account.name) {
      editAccountName(newName).catch(err => {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        alert(err.message);
      });
    }

    setEditing(false);
  }, [account.name, editAccountName, setEditing]);

  return (
    <PageLayout>
      <div className="pb-4">
        <div className="relative pt-4 flex items-center justify-center">
          {editing ? (
            <div className="flex-1 flex flex-col items-center">
              <FormField
                ref={editAccNameFieldRef}
                defaultValue={account.name}
                className={classNames(
                  "w-full mx-auto max-w-xs",
                  "text-2xl font-light text-gray-700 text-center"
                )}
                style={{ padding: "0.075rem 0" }}
                maxLength={16}
                spellCheck={false}
              />

              <div className="mb-2 flex items-stretch">
                <button
                  className={classNames(
                    "mx-1",
                    "px-2 py-1",
                    "rounded overflow-hidden",
                    "text-gray-600 text-sm",
                    "transition ease-in-out duration-200",
                    "hover:bg-black-5",
                    "opacity-75 hover:opacity-100 focus:opacity-100"
                  )}
                  onClick={handleCancelClick}
                >
                  Cancel
                </button>

                <button
                  className={classNames(
                    "mx-1",
                    "px-2 py-1",
                    "rounded overflow-hidden",
                    "text-gray-600 text-sm",
                    "transition ease-in-out duration-200",
                    "hover:bg-black-5",
                    "opacity-75 hover:opacity-100 focus:opacity-100"
                  )}
                  onClick={handleSaveClick}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <h1
              className={classNames(
                "mb-2",
                "text-2xl font-light text-gray-700 text-center"
              )}
            >
              {account.name}
            </h1>
          )}

          <button
            className={classNames(
              "absolute top-0 right-0",
              "px-2 py-1",
              "rounded overflow-hidden",
              "flex items-center",
              "text-gray-600 text-sm",
              "transition ease-in-out duration-200",
              "hover:bg-black-5",
              "opacity-75 hover:opacity-100 focus:opacity-100"
            )}
            onClick={handleEditClick}
          >
            {!editing && (
              <>
                <EditIcon
                  className={classNames(
                    "-ml-1 mr-1 h-4 w-auto stroke-current stroke-2"
                  )}
                />
                Edit
              </>
            )}
          </button>
        </div>

        <hr className="mb-4" />

        <p className="font-base text-gray-600">
          Hello, {account.publicKeyHash}
        </p>

        <div className="my-4">
          <Identicon hash={account.publicKeyHash} size={56} />
        </div>
      </div>
    </PageLayout>
  );
};

export default Explore;
