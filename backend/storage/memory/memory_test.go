package memory_test

import (
	"testing"

	"github.com/krackenservices/threadwell/storage/memory"
	"github.com/krackenservices/threadwell/testhelpers"
)

func TestMemoryStorage(t *testing.T) {
	store := memory.New()
	testhelpers.RunStorageSuite(t, "memory", store)
	testhelpers.RunMoveSubtreeSuite(t, "memory", store)
	testhelpers.RunSettingsSuite(t, "memory", store)
}
