import { useMemo } from "#sauron";
import { filenameIconMap} from  "~/components/midgardr"

/** With language - now correctly tests against ".tsx"
const Icon = useFileIcon('tsx');

// With filename
const Icon = useFileIcon(undefined, 'tailwind.config.js');

// Render
{Icon && <Icon />} */
export const useFileIcon = (language?: string, filename?: string) => {
  const icon = useMemo(() => {
    if (filename && filenameIconMap[filename]) {      return filenameIconMap[filename];    }

    if (language) {
      const match = Object.entries(filenameIconMap).find(([pattern]) => {
        const regex = new RegExp(
          `^${pattern
            .replace(/\\/g, '\\\\')
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')}$`
        );
        return regex.test(`.${language}`);
      });
      
      if (match) return match[1];
    }

    if (filename) {
      const match = Object.entries(filenameIconMap).find(([pattern]) => {
        const regex = new RegExp(
          `^${pattern
            .replace(/\\/g, '\\\\')
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')}$`
        );
        return regex.test(filename);
      });
      
      if (match) return match[1];
    }

    return null;
  }, [language, filename]);

  return icon;
};
