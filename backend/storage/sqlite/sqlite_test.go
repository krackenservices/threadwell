package sqlite_test

import (
	"os"
	"testing"

	"github.com/krackenservices/threadwell/storage/sqlite"
	"github.com/krackenservices/threadwell/testhelpers"
)

func TestSQLiteStorage(t *testing.T) {
	_ = os.MkdirAll("./testdata", 0755)
	path := "./testdata/test.db"
	_ = os.Remove(path)

	store, err := sqlite.New(path)
	if err != nil {
		t.Fatalf("setup failed: %v", err)
	}
	testhelpers.RunStorageSuite(t, "sqlite", store)
	testhelpers.RunMoveSubtreeSuite(t, "sqlite", store)
	testhelpers.RunSettingsSuite(t, "sqlite", store)

	_ = os.RemoveAll("./testdata")
}
