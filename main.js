const {
	Plugin,
	PluginSettingTab,
	Setting,
	Notice,
	TFile,
	MarkdownView,
	Component,
} = require('obsidian');
const { normalizePath } = require('obsidian');

const DEFAULT_SETTINGS = {
	trashFolder: 'Trash',
	deleteAfterHours: 72,
	checkIntervalMinutes: 30,
	deleteUniqueAttachments: false,
	deletedAtProperty: 'deleted_at',
	originalPathProperty: 'original_path',
	language: 'en',
	autoDeleteEnabled: true,
};

// Система локализации
const LANGUAGES = {
	ru: {
		settings: {
			title: 'Better trash',
			trashFolder: 'Папка для удалённых файлов',
			trashFolderDesc: 'Укажите папку, куда будут перемещаться удалённые файлы. По умолчанию: Trash',
			deleteAfterHours: 'Время хранения файлов в корзине (в часах)',
			deleteAfterHoursDesc: 'Укажите, через сколько часов файлы будут автоматически удалены из корзины. По умолчанию: 72',
			checkInterval: 'Интервал проверки корзины (в минутах)',
			checkIntervalDesc: 'Укажите, как часто (в минутах) плагин будет проверять корзину на наличие устаревших файлов. По умолчанию: 30',
			deleteUniqueAttachments: 'Удалять уникальные вложения',
			deleteUniqueAttachmentsDesc: 'При безвозвратном удалении файла также удалять его вложения, на которые нет ссылок из других файлов.',
			deletedAtProperty: 'Название свойства даты удаления',
			deletedAtPropertyDesc: 'Название YAML-свойства для хранения даты и времени удаления файла.',
			originalPathProperty: 'Название свойства оригинального пути',
			originalPathPropertyDesc: 'Название YAML-свойства для хранения оригинального пути файла.',
			checkTrashNow: 'Проверить корзину сейчас',
			checkTrashNowDesc: 'Запустить проверку корзины и удалить устаревшие файлы.',
			checkTrashButton: 'Проверить корзину',
			checking: 'Проверяем...',
			language: 'Язык интерфейса',
			languageDesc: 'Выберите язык для интерфейса плагина',
			autoDeleteEnabled: 'Автоочистка корзины',
			autoDeleteEnabledDesc: 'Если выключено, файлы не будут удаляться автоматически из корзины.',
		},
		notices: {
			trashFolderNotSet: 'Папка для удалённых файлов не выбрана в настройках Better Trash.',
			fileNotInTrash: 'Этот файл не находится в корзине',
			fileNotFound: 'Файл не найден.',
			fileNotInTrashInfo: 'Файл не найден в корзине.',
			noActiveFile: 'Нет активного файла для восстановления.',
			fileRestored: 'Файл восстановлен:',
			restoreError: 'Ошибка при восстановлении файла:',
			folderCreateError: 'Ошибка при создании папки:',
			fileMovedToTrash: 'Файл перемещен в корзину:',
			moveToTrashError: 'Ошибка при перемещении файла в корзину:',
			fileDeleted: 'Файл удален безвозвратно:',
			deleteError: 'Ошибка при безвозвратном удалении файла:',
			fileDeletedFromTrash: 'Файл удален из корзины:',
			deleteFromTrashError: 'Ошибка при полном удалении файла:',
			attachmentDeleted: 'Удалено вложение:',
			attachmentDeleteError: 'Ошибка при удалении вложения',
			checkCompleted: 'Проверка корзины завершена',
			checkError: 'Ошибка при проверке корзины:',
			trashCreateError: 'Ошибка при создании папки корзины:',
			fileRestoredManual: 'Файл восстановлен:',
			invalidDate: 'Некорректная дата:',
			dateParseError: 'Ошибка парсинга даты',
			deleteNever: 'никогда',
		},
		ui: {
			movedToTrash: 'Файл перемещен в корзину:',
			willBeDeleted: 'Файл будет окончательно удален после:',
			restore: 'Восстановить',
			deletePermanently: 'Удалить безвозвратно',
			deleteNever: 'никогда',
		}
	},
	en: {
		settings: {
			title: 'Better trash',
			trashFolder: 'Trash folder',
			trashFolderDesc: 'Specify the folder where deleted files will be moved. Default: Trash',
			deleteAfterHours: 'File retention time in trash (hours)',
			deleteAfterHoursDesc: 'Specify how many hours files will be automatically deleted from trash. Default: 72',
			checkInterval: 'Trash check interval (minutes)',
			checkIntervalDesc: 'Specify how often (in minutes) the plugin will check trash for outdated files. Default: 30',
			deleteUniqueAttachments: 'Delete unique attachments',
			deleteUniqueAttachmentsDesc: 'When permanently deleting a file, also delete its attachments that have no links from other files.',
			deletedAtProperty: 'Deleted date property name',
			deletedAtPropertyDesc: 'Name of YAML property for storing file deletion date and time.',
			originalPathProperty: 'Original path property name',
			originalPathPropertyDesc: 'Name of YAML property for storing original file path.',
			checkTrashNow: 'Check trash now',
			checkTrashNowDesc: 'Run trash check and delete outdated files.',
			checkTrashButton: 'Check trash',
			checking: 'Checking...',
			language: 'Interface language',
			languageDesc: 'Select language for plugin interface',
			autoDeleteEnabled: 'Auto-delete trash',
			autoDeleteEnabledDesc: 'If disabled, files will not be automatically deleted from trash.',
		},
		notices: {
			trashFolderNotSet: 'Trash folder is not selected in Better Trash settings.',
			fileNotInTrash: 'This file is not in trash',
			fileNotFound: 'File not found.',
			fileNotInTrashInfo: 'File not found in trash.',
			noActiveFile: 'No active file to restore.',
			fileRestored: 'File restored:',
			restoreError: 'Error restoring file:',
			folderCreateError: 'Error creating folder:',
			fileMovedToTrash: 'File moved to trash:',
			moveToTrashError: 'Error moving file to trash:',
			fileDeleted: 'File permanently deleted:',
			deleteError: 'Error permanently deleting file:',
			fileDeletedFromTrash: 'File deleted from trash:',
			deleteFromTrashError: 'Error completely deleting file:',
			attachmentDeleted: 'Attachment deleted:',
			attachmentDeleteError: 'Error deleting attachment',
			checkCompleted: 'Trash check completed',
			checkError: 'Error checking trash:',
			trashCreateError: 'Error creating trash folder:',
			fileRestoredManual: 'File restored:',
			invalidDate: 'Invalid date:',
			dateParseError: 'Date parsing error',
			deleteNever: 'never',
		},
		ui: {
			movedToTrash: 'File moved to trash:',
			willBeDeleted: 'File will be permanently deleted after:',
			restore: 'Restore',
			deletePermanently: 'Delete permanently',
			deleteNever: 'never',
		}
	}
};

class TrashInfoComponent extends Component {
	constructor(app, plugin, leaf, file, entry) {
		super();
		this.app = app;
		this.plugin = plugin;
		this.leaf = leaf;
		this.file = file;
		this.entry = entry;
	}

	onload() {
		// Удаляем все старые контейнеры trash-info-container в этом leaf/view
		const oldViewContentEl = this.leaf.view.containerEl.querySelector('.view-content');
		if (oldViewContentEl) {
			const parent = oldViewContentEl.parentNode;
			if (parent) {
				const oldContainers = parent.querySelectorAll('.trash-info-container');
				oldContainers.forEach(el => el.remove());
			}
		}

		const deletionDate = new Date(this.entry.deletedAt);
		const fullyDeleteTime = new Date(deletionDate);
		fullyDeleteTime.setHours(fullyDeleteTime.getHours() + this.plugin.settings.deleteAfterHours);

		const container = this.leaf.containerEl.createDiv({ cls: 'trash-info-container' });
		this.containerEl = container;

		const textContainer = container.createDiv(); // Контейнер для текста
		const deletedEl = textContainer.createEl('p');
		deletedEl.textContent = `${this.plugin.t('ui.movedToTrash')} ${deletionDate.toLocaleString()}`;
		const deleteEl = textContainer.createEl('p');
		let deleteTimeText;
		if (!this.plugin.settings.autoDeleteEnabled) {
			deleteTimeText = this.plugin.t('ui.deleteNever');
		} else {
			deleteTimeText = fullyDeleteTime.toLocaleString();
		}
		deleteEl.textContent = `${this.plugin.t('ui.willBeDeleted')} ${deleteTimeText}`;

		const buttonsContainer = container.createDiv({ cls: 'trash-buttons-container' });  // Контейнер для кнопок

		// Кнопка восстановления
		const restoreButton = buttonsContainer.createEl('button', { 
			text: this.plugin.t('ui.restore'),
			cls: 'trash-restore-button'
		});
		restoreButton.addEventListener('mousedown', async (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.app.workspace.setActiveLeaf(this.leaf);
			await new Promise(resolve => setTimeout(resolve, 0));
			this.plugin.restoreFileCommandByPath(this.file.path);
		});

		// Кнопка "Удалить безвозвратно"
		const deletePermanentlyButton = buttonsContainer.createEl('button', { 
			text: this.plugin.t('ui.deletePermanently'),
			cls: 'trash-delete-permanently-button'
		});
		deletePermanentlyButton.addEventListener('mousedown', async (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.app.workspace.setActiveLeaf(this.leaf);
			await new Promise(resolve => setTimeout(resolve, 0));
			this.plugin.deleteFilePermanentlyByPath(this.file.path);
		});

		// Добавляем контейнер сразу после элемента, содержащего редактор и заголовок
		const viewContentEl = this.leaf.view.containerEl.querySelector('.view-content');
		if (viewContentEl) {
			viewContentEl.parentNode.insertBefore(container, viewContentEl.nextSibling);
		}
	}

	onunload() {
		if (this.containerEl) {
			this.containerEl.remove();
		}
	}
}

module.exports = class BetterTrashPlugin extends Plugin {
	trashInfoComponents = new Map();
	movedFiles = new Map(); // Map для хранения временных меток
	isRestoring = false; // Флаг восстановления
	checkIntervalId = null; // ID интервала проверки

	async onload() {
		await this.loadSettings();

		// Загружаем CSS стили
		this.loadStyles();

		this.addSettingTab(new BetterTrashSettingTab(this.app, this));
		this.patchDeletionMethods();

		// Запускаем первую проверку и интервал
		this.startCheckInterval();

		this.addCommand({
			id: 'restore-file',
			name: 'Restore file from trash',
			callback: () => this.restoreFileCommand(),
		});

		// Обработчик изменения активного листа
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', this.handleLeafChange.bind(this))
		);
		
		// Обработчик события переименования (rename)
		this.registerEvent(
			this.app.vault.on('rename', (file, oldPath) => {
				this.handleRename(file, oldPath);
			})
		);

		// Обработчик события загрузки метаданных
		this.registerEvent(
			this.app.metadataCache.on('resolved', () => {
				const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (activeView) {
					this.handleLeafChange(activeView.leaf);
				}
			})
		);

		// Обработчик события готовности интерфейса
		this.registerEvent(
			this.app.workspace.on('layout-ready', () => {
				const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (activeView) {
					this.handleLeafChange(activeView.leaf);
				}
			})
		);

		// Проверяем активный лист при загрузке плагина с увеличенной задержкой
		setTimeout(() => {
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (activeView) {
				this.handleLeafChange(activeView.leaf);
			}
		}, 500);
	}

	onunload() {
		if (this.originalDelete) {
			this.app.vault.delete = this.originalDelete;
		}
		if (this.originalTrash) {
			this.app.vault.trash = this.originalTrash;
		}
		this.clearTrashInfoContainers();
		this.stopCheckInterval();
		this.movedFiles.clear(); // Очищаем movedFiles
		
		// Удаляем добавленные стили
		const styleEl = document.getElementById('better-trash-styles');
		if (styleEl) {
			styleEl.remove();
		}
	}

	// Метод для запуска интервала проверки
	startCheckInterval() {
		// Останавливаем предыдущий интервал, если он есть
		this.stopCheckInterval();

		// Не запускаем интервал, если автоудаление выключено
		if (!this.settings.autoDeleteEnabled) return;

		// Первая проверка через 1 минуту после запуска
		setTimeout(() => {
			this.checkTrashFiles();
			
			// Затем запускаем регулярную проверку по заданному интервалу
			this.checkIntervalId = window.setInterval(
				() => this.checkTrashFiles(),
				this.settings.checkIntervalMinutes * 60 * 1000
			);
		}, 60000); // 1 минута = 60000 мс
	}

	// Метод для остановки интервала проверки
	stopCheckInterval() {
		if (this.checkIntervalId) {
			clearInterval(this.checkIntervalId);
			this.checkIntervalId = null;
		}
	}

	// Обработчик переименования – используется для отслеживания ручного перемещения файла в корзину
	async handleRename(file, oldPath) {
		if (file instanceof TFile && file.extension === 'md') {
			const newFilePathNormalized = normalizePath(file.path);
			const oldFilePathNormalized = normalizePath(oldPath);
			const trashFolderPath = normalizePath(this.settings.trashFolder);

			// Проверяем, был ли файл недавно перемещен плагином
			const now = Date.now();
			const movedFileInfo = this.movedFiles.get(newFilePathNormalized);
			
			if (movedFileInfo && (now - movedFileInfo.timestamp) < 5000) { // 5 секунд окно
				this.movedFiles.delete(newFilePathNormalized);
				return; // Пропускаем обработку
			}

			// Если файл перемещен из корзины (был в корзине, теперь не в корзине)
			if (oldFilePathNormalized.startsWith(trashFolderPath) && !newFilePathNormalized.startsWith(trashFolderPath)) {
						if (!this.isRestoring) { // Проверяем флаг
					// Удаляем YAML-свойства при ручном перемещении из корзины
					await this.removeFileTrashInfo(file);
					new Notice(`${this.t('notices.fileRestoredManual')} ${file.name}`);
				}
			}
			// Если файл перемещен в корзину (не был в корзине, теперь в корзине)
			else if (!oldFilePathNormalized.startsWith(trashFolderPath) && newFilePathNormalized.startsWith(trashFolderPath)) {
				// Добавляем YAML-свойства с оригинальным путем
				await this.setFileTrashInfo(file, oldPath);
			}
			// Если файл переименован внутри корзины
			else if (oldFilePathNormalized.startsWith(trashFolderPath) && newFilePathNormalized.startsWith(trashFolderPath)) {
				const trashInfo = await this.getFileTrashInfo(file);
				if (trashInfo) {
					// Сохраняем исходный путь, а не путь внутри корзины
					await this.setFileTrashInfo(file, trashInfo.originalPath);
				}
			}

			setTimeout(() => this.updateTrashUI(), 500);
		}
	}

	patchDeletionMethods() {
		const plugin = this;
		
		// Сохраняем оригинальные методы только если они еще не были сохранены
		if (!this.originalDelete) {
		this.originalDelete = this.app.vault.delete.bind(this.app.vault);
		}
		if (!this.originalTrash && this.app.vault.trash) {
			this.originalTrash = this.app.vault.trash.bind(this.app.vault);
		}
		
		// Патчим методы
		this.app.vault.delete = async function (file, ...args) {
			return await plugin.handleDeletion(this, file, 'delete');
		};

		if (this.app.vault.trash) {
			this.app.vault.trash = async function (file, ...args) {
				return await plugin.handleDeletion(this, file, 'trash');
			};
		}
	}

	async handleLeafChange(leaf) {
		if (leaf && leaf.view && leaf.view.file) { // Проверяем наличие файла
			const file = leaf.view.file;
			await this.showTrashInfo(file, leaf);
		} else {
			this.clearTrashInfoForLeaf(leaf);
		}
	}

	async showTrashInfo(file, leaf) {
		if (!file || !(file instanceof TFile) || file.extension !== 'md') {
			this.clearTrashInfoForLeaf(leaf);
			return;
		}

		// Показываем только в markdown-leaf'ах (основные рабочие окна)
		if (leaf.view.getViewType() !== 'markdown') {
			this.clearTrashInfoForLeaf(leaf);
			return;
		}

		if (!this.settings.trashFolder) return;
		const trashFolderPath = normalizePath(this.settings.trashFolder);
		const filePath = normalizePath(file.path);

		// Отображаем плашку только если файл находится в корзине и имеет YAML-свойства
		if (!filePath.startsWith(trashFolderPath)) {
			this.clearTrashInfoForLeaf(leaf);
			return;
		}

		const trashInfo = await this.getFileTrashInfo(file);
		if (!trashInfo) {
			this.clearTrashInfoForLeaf(leaf);
			return;
		}

		this.clearTrashInfoForLeaf(leaf);
		const component = new TrashInfoComponent(this.app, this, leaf, file, trashInfo);
		this.trashInfoComponents.set(leaf, component);
		component.load();
	}

	clearTrashInfoForLeaf(leaf) {
		if (this.trashInfoComponents.has(leaf)) {
			this.trashInfoComponents.get(leaf).unload();
			this.trashInfoComponents.delete(leaf);
		}
	}

	clearTrashInfoContainers() {
		for (const component of this.trashInfoComponents.values()) {
			component.unload();
		}
		this.trashInfoComponents.clear();
	}

	// Восстановление файла по пути (вызывается из плашки)
	async restoreFileCommandByPath(filePath) {
		if (!this.settings.trashFolder) {
			new Notice(this.t('notices.trashFolderNotSet'));
			return;
		}
		const trashFolderPath = normalizePath(this.settings.trashFolder);
		if (!filePath.startsWith(trashFolderPath)) {
			new Notice(this.t('notices.fileNotInTrash'));
			return;
		}

		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (!file || !(file instanceof TFile)) {
			new Notice(this.t('notices.fileNotFound'));
			return;
		}

		const trashInfo = await this.getFileTrashInfo(file);
		if (!trashInfo) {
			new Notice(this.t('notices.fileNotInTrashInfo'));
			return;
		}

		await this.restoreFile(file, trashInfo);
	}

	async deleteFilePermanentlyByPath(filePath) {
		if (!this.settings.trashFolder) {
			new Notice(this.t('notices.trashFolderNotSet'));
			return;
		}
		const trashFolderPath = normalizePath(this.settings.trashFolder);
		if (!filePath.startsWith(trashFolderPath)) {
			new Notice(this.t('notices.fileNotInTrash'));
			return;
		}
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (!file) {
			new Notice(this.t('notices.fileNotFound'));
			return;
		}

		try {
			await this.deleteFileWithUniqueAttachments(file);
			new Notice(`${this.t('notices.fileDeleted')} ${file.name}`);

			// Очищаем запись из movedFiles
			this.movedFiles.delete(filePath);

			// Очищаем плашку
			this.app.workspace.iterateAllLeaves((leaf) => {
				if (leaf.view instanceof MarkdownView && leaf.view.file && normalizePath(leaf.view.file.path) === normalizePath(filePath)) {
					this.clearTrashInfoForLeaf(leaf);
				}
			});

		} catch (error) {
			new Notice(`${this.t('notices.deleteError')} ${error}`);
		}
	}

	async restoreFileCommand() {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice(this.t('notices.noActiveFile'));
			return;
		}
		if (!this.settings.trashFolder) {
			new Notice(this.t('notices.trashFolderNotSet'));
			return;
		}
		const trashFolderPath = normalizePath(this.settings.trashFolder);
		const filePath = normalizePath(activeFile.path);

		if (!filePath.startsWith(trashFolderPath)) {
			new Notice(this.t('notices.fileNotInTrash'));
			return;
		}

		const trashInfo = await this.getFileTrashInfo(activeFile);
		if (!trashInfo) {
			new Notice(this.t('notices.fileNotInTrashInfo'));
			return;
		}
		await this.restoreFile(activeFile, trashInfo);
	}

	async restoreFile(file, trashInfo) {
		this.isRestoring = true;
		try {
			await this.restoreSingleFile(file, trashInfo.originalPath);
		} finally {
			this.isRestoring = false;
		}
		
		setTimeout(() => this.updateTrashUI(), 500);
	}

	async restoreSingleFile(file, originalPath) {
		const vault = this.app.vault;

		// Создаем директорию рекурсивно, если её нет
		const originalDir = originalPath.substring(0, originalPath.lastIndexOf('/'));
		if (originalDir) {
			try {
				if (!await vault.adapter.exists(originalDir)) {
					await vault.createFolder(originalDir);
				}
			} catch (error) {
				new Notice(`${this.t('notices.folderCreateError')} ${error}`);
				return;
			}
		}

		// Проверка на существование файла с таким именем и добавление суффикса, если нужно
		let newPath = originalPath;
		let counter = 1;
		while (await vault.adapter.exists(newPath)) {
			const ext = file.extension;
			const base = originalPath.substring(0, originalPath.length - ext.length - 1);
			newPath = `${base} (${counter}).${ext}`;
			counter++;
		}

		try {
			await this.app.fileManager.renameFile(file, newPath);
			await this.removeFileTrashInfo(file);
			
			// Очищаем запись из movedFiles
			this.movedFiles.delete(file.path);
			
			new Notice(`${this.t('notices.fileRestored')} ${newPath}`);
		} catch (error) {
			new Notice(`${this.t('notices.restoreError')} ${error}`);
		}
	}

	updateTrashUI() {
		this.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.view instanceof MarkdownView) {
				this.handleLeafChange(leaf);
			}
		});
	}

	async handleDeletion(vault, file, method) {
		// Если это не MD файл, используем стандартное поведение Obsidian
		if (!(file instanceof TFile) || file.extension !== 'md') {
			if (method === 'delete') return await this.originalDelete(file);
			else if (method === 'trash') return await this.originalTrash(file);
		}

		if (!this.settings.trashFolder) {
			new Notice(this.t('notices.trashFolderNotSet'));
			return;
		}
		const trashFolderPath = normalizePath(this.settings.trashFolder);
		const filePath = normalizePath(file.path);

		// Если файл уже находится в корзине – удаляем безвозвратно
		if (filePath.startsWith(trashFolderPath)) {
			try {
				await this.deleteFileWithUniqueAttachments(file);
				new Notice(`${this.t('notices.fileDeleted')} ${file.name}`);
			} catch (error) {
				new Notice(`${this.t('notices.deleteError')} ${error}`);
			}
			return;
		}

		// Перемещаем файл в корзину
		await this.moveFileToTrash(file, file.path);
		setTimeout(() => this.updateTrashUI(), 500);
	}

	async moveFileToTrash(file, originalPath) {
		const vault = this.app.vault;
		const trashFolderPath = normalizePath(this.settings.trashFolder);
		
		// Создаем папку корзины, если её нет
		if (!vault.getAbstractFileByPath(trashFolderPath)) {
			try {
				await vault.createFolder(trashFolderPath);
			} catch (e) {
				new Notice(`${this.t('notices.trashCreateError')} ${e}`);
					return;
				}
			}

		// Проверяем, что нет файла с таким же именем
		let newPath = `${trashFolderPath}/${file.name}`;
		let counter = 1;
		while (await vault.adapter.exists(newPath)) {
			const ext = file.extension;
			const base = file.name.substring(0, file.name.length - ext.length - 1);
			newPath = `${trashFolderPath}/${base} (${counter}).${ext}`;
			counter++;
		}

		try {
			// Добавляем файл в movedFiles ДО renameFile для предотвращения race condition
			this.movedFiles.set(newPath, { timestamp: Date.now() });
			
			await this.app.fileManager.renameFile(file, newPath);
			await this.setFileTrashInfo(file, originalPath);
			new Notice(`${this.t('notices.fileMovedToTrash')} ${file.name}`);
		} catch (e) {
			// Удаляем из movedFiles в случае ошибки
			this.movedFiles.delete(newPath);
			new Notice(`${this.t('notices.moveToTrashError')} ${e}`);
		}
	}

	async getAllTrashFiles() {
		const trashFolderPath = normalizePath(this.settings.trashFolder);
		const allFiles = this.app.vault.getFiles();
		const trashFiles = [];

		for (const file of allFiles) {
			const filePath = normalizePath(file.path);
			if (filePath.startsWith(trashFolderPath) && file.extension === 'md') {
				const trashInfo = await this.getFileTrashInfo(file);
				if (trashInfo) {
					trashFiles.push({
						file: file,
						...trashInfo
					});
				}
			}
		}

		return trashFiles;
	}

	// Методы для работы с YAML-свойствами
	async getFileTrashInfo(file) {
		if (!(file instanceof TFile) || file.extension !== 'md') return null;
		
		const cache = this.app.metadataCache.getFileCache(file);
		if (!cache || !cache.frontmatter) return null;

		const deletedAt = cache.frontmatter[this.settings.deletedAtProperty];
		const originalPath = cache.frontmatter[this.settings.originalPathProperty];

		if (!deletedAt || !originalPath) return null;

		return {
			deletedAt: deletedAt,
			originalPath: originalPath
		};
	}

	async setFileTrashInfo(file, originalPath) {
		if (!(file instanceof TFile) || file.extension !== 'md') return true;

		try {
			const now = new Date();
			const deletedAt = now.getFullYear() + '-' + 
				String(now.getMonth() + 1).padStart(2, '0') + '-' + 
				String(now.getDate()).padStart(2, '0') + 'T' + 
				String(now.getHours()).padStart(2, '0') + ':' + 
				String(now.getMinutes()).padStart(2, '0') + ':' + 
				String(now.getSeconds()).padStart(2, '0');

			await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
				frontmatter[this.settings.deletedAtProperty] = deletedAt;
				frontmatter[this.settings.originalPathProperty] = originalPath;
			});
			return true;
		} catch (error) {
			console.error('Ошибка при установке YAML-свойств:', error);
			return false;
		}
	}

	async removeFileTrashInfo(file) {
		if (!(file instanceof TFile) || file.extension !== 'md') return true;

		try {
			await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
				delete frontmatter[this.settings.deletedAtProperty];
				delete frontmatter[this.settings.originalPathProperty];
			});
			return true;
		} catch (error) {
			console.error('Ошибка при удалении YAML-свойств:', error);
			return false;
		}
	}

	// Получение уникальных вложений файла (на которые нет ссылок из других файлов)
	async getUniqueAttachments(file) {
		if (!this.settings.deleteUniqueAttachments) return [];

		const cache = this.app.metadataCache.getFileCache(file) || {};
		const embedItems = cache.embeds || [];
		const uniqueAttachments = [];

		for (const embed of embedItems) {
			const linkedFile = this.app.metadataCache.getFirstLinkpathDest(embed.link, file.path);

			if (
				linkedFile &&
				linkedFile instanceof TFile &&
				linkedFile.extension !== 'md'
			) {
				// Проверяем, есть ли ссылки на linkedFile из других файлов
				const resolvedLinks = this.app.metadataCache.resolvedLinks;
				let hasExternalLinks = false;

				for (const sourceFile in resolvedLinks) {
					// Пропускаем сам файл
					if (normalizePath(sourceFile) === normalizePath(file.path)) continue;

					const targets = resolvedLinks[sourceFile];
					for (const targetFile in targets) {
						if (normalizePath(targetFile) === normalizePath(linkedFile.path)) {
							hasExternalLinks = true;
							break;
						}
					}
					if (hasExternalLinks) break;
				}

				// Если нет внешних ссылок, это уникальное вложение
				if (!hasExternalLinks) {
					uniqueAttachments.push(linkedFile);
				}
			}
		}

		return uniqueAttachments;
	}

	async deleteFileWithUniqueAttachments(file) {
		// Удаляем уникальные вложения, если включена соответствующая настройка
		if (this.settings.deleteUniqueAttachments) {
			const uniqueAttachments = await this.getUniqueAttachments(file);
			for (const attachment of uniqueAttachments) {
				try {
					await this.originalDelete(attachment, true);
					new Notice(`${this.t('notices.attachmentDeleted')} ${attachment.name}`);
				} catch (error) {
					console.error(`Ошибка при удалении вложения ${attachment.path}:`, error);
					new Notice(`${this.t('notices.attachmentDeleteError')} ${attachment.name}: ${error}`);
				}
			}
		}

		// Удаляем основной файл
		await this.originalDelete(file, true);
	}

	// Метод для очистки устаревших записей в movedFiles
	cleanupMovedFiles() {
		const now = Date.now();
		const maxAge = 10000; // 10 секунд
		
		for (const [path, info] of this.movedFiles.entries()) {
			// Удаляем записи старше maxAge
			if (now - info.timestamp > maxAge) {
				this.movedFiles.delete(path);
				continue;
			}
			
			// Проверяем, существует ли файл по этому пути
			const file = this.app.vault.getAbstractFileByPath(path);
			if (!file) {
				// Файл не существует - удаляем запись
				this.movedFiles.delete(path);
			}
		}
	}

	async checkTrashFiles() {
		// Если автоудаление выключено, ничего не делаем
		if (!this.settings.autoDeleteEnabled) return;
		// Очищаем устаревшие записи в movedFiles
		this.cleanupMovedFiles();

		const trashFiles = await this.getAllTrashFiles();
		if (!trashFiles) return;

		const now = new Date();

		// Обработка файлов в корзине
		for (const trashFile of trashFiles) {
			const file = trashFile.file;
			
			// Парсим дату удаления
			let deletionDate;
			try {
				deletionDate = new Date(trashFile.deletedAt);
				if (isNaN(deletionDate.getTime())) {
					console.error(`${this.t('notices.invalidDate')} ${trashFile.deletedAt}`);
					continue;
				}
			} catch (error) {
				console.error(`${this.t('notices.dateParseError')} ${trashFile.deletedAt}:`, error);
				continue;
			}
			
			const diffTime = Math.abs(now - deletionDate);
			const diffHours = diffTime / (1000 * 60 * 60);

			if (diffHours >= this.settings.deleteAfterHours) {
				// Пора удалять файл
				try {
					await this.deleteFileWithUniqueAttachments(file);
					
					// Очищаем запись из movedFiles
					this.movedFiles.delete(file.path);
					
					new Notice(`${this.t('notices.fileDeletedFromTrash')} ${file.name}`);
				} catch (e) {
					new Notice(`${this.t('notices.deleteFromTrashError')} ${e}`);
				}
			}
		}

		// Обработка файлов в корзине, которых нет в YAML-свойствах
		const trashFolderPath = normalizePath(this.settings.trashFolder);
		const filesInTrash = this.app.vault.getFiles().filter((file) => {
			return normalizePath(file.path).startsWith(trashFolderPath) && file.extension === 'md';
		});

		for (const fileInTrash of filesInTrash) {
			const trashInfo = await this.getFileTrashInfo(fileInTrash);
			if (!trashInfo) {
				// Если файл есть в корзине, но нет YAML-свойств -> считаем, что он перемещен вручную.
				// Записываем путь в корень хранилища, а не текущий путь в корзине.
				const originalPath = fileInTrash.name;
				await this.setFileTrashInfo(fileInTrash, originalPath);
			}
		}
		setTimeout(() => this.updateTrashUI(), 500);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	loadStyles() {
		// Добавляем CSS стили через создание элемента style
		const styleEl = document.createElement('style');
		styleEl.id = 'better-trash-styles';
		styleEl.textContent = `
			/* Better Trash Plugin Styles */
			
			/* Контейнер информации о корзине */
			.trash-info-container {
				background-color: rgba(139, 0, 0, 0.3);
				padding: 10px;
				border-radius: 5px;
				margin-top: 10px;
				margin-bottom: 5px;
			}
			
			/* Контейнер для кнопок */
			.trash-buttons-container {
				display: flex;
				flex-direction: row;
				gap: 10px;
				align-items: center;
				margin-top: 5px;
			}
			
			/* Кнопка восстановления */
			.trash-restore-button {
				/* Используем стандартные стили Obsidian для кнопок */
			}
			
			/* Кнопка безвозвратного удаления - более специфичные селекторы */
			button.trash-delete-permanently-button {
				background-color: darkred !important;
				color: white !important;
				border-color: darkred !important;
			}
			
			button.trash-delete-permanently-button:hover {
				background-color: #8b0000 !important;
				color: white !important;
			}
			
			button.trash-delete-permanently-button:active {
				background-color: #660000 !important;
				color: white !important;
			}
			
			/* Альтернативный селектор для максимальной специфичности */
			.trash-info-container .trash-buttons-container button.trash-delete-permanently-button {
				background-color: darkred !important;
				color: white !important;
				border-color: darkred !important;
			}
			
			/* Еще более специфичный селектор */
			body .trash-info-container .trash-buttons-container button.trash-delete-permanently-button {
				background-color: darkred !important;
				color: white !important;
				border-color: darkred !important;
			}
			
			/* Стили для всех состояний кнопки */
			body .trash-info-container .trash-buttons-container button.trash-delete-permanently-button:hover,
			body .trash-info-container .trash-buttons-container button.trash-delete-permanently-button:focus,
			body .trash-info-container .trash-buttons-container button.trash-delete-permanently-button:active {
				background-color: #8b0000 !important;
				color: white !important;
				border-color: #8b0000 !important;
			}
			
			/* Стили для полей ввода с ошибкой */
			.trash-input-error {
				border-color: red !important;
			}
			
			/* Стили для полей ввода без ошибки */
			.trash-input-normal {
				border-color: var(--background-modifier-border) !important;
			}
		`;
		document.head.appendChild(styleEl);
	}

	async saveSettings() {
		// Валидация числовых значений
		if (typeof this.settings.deleteAfterHours !== 'number' || this.settings.deleteAfterHours < 1) {
			this.settings.deleteAfterHours = DEFAULT_SETTINGS.deleteAfterHours;
		}
		if (typeof this.settings.checkIntervalMinutes !== 'number' || this.settings.checkIntervalMinutes < 1) {
			this.settings.checkIntervalMinutes = DEFAULT_SETTINGS.checkIntervalMinutes;
		}
		// Валидация строк
		if (!this.settings.trashFolder || !this.settings.trashFolder.trim()) {
			this.settings.trashFolder = 'Trash';
		}
		if (!this.settings.deletedAtProperty || !this.settings.deletedAtProperty.trim()) {
			this.settings.deletedAtProperty = 'deleted_at';
		}
		if (!this.settings.originalPathProperty || !this.settings.originalPathProperty.trim()) {
			this.settings.originalPathProperty = 'original_path';
		}

		await this.saveData(this.settings);
		
		// Перезапускаем интервал проверки при изменении настроек
		this.startCheckInterval();
		
		// Восстанавливаем оригинальные методы и перепатчиваем
		this.unpatchDeletionMethods();
		this.patchDeletionMethods();
		
		setTimeout(() => this.updateTrashUI(), 500);
	}

	// Метод для восстановления оригинальных методов
	unpatchDeletionMethods() {
		if (this.originalDelete) {
			this.app.vault.delete = this.originalDelete;
		}
		if (this.originalTrash) {
			this.app.vault.trash = this.originalTrash;
		}
	}

	// Метод для получения перевода
	t(key) {
		const lang = this.settings.language || 'en';
		const keys = key.split('.');
		let value = LANGUAGES[lang];
		
		for (const k of keys) {
			if (value && value[k]) {
				value = value[k];
			} else {
				// Fallback на английский язык
				value = LANGUAGES.en;
				for (const fallbackKey of keys) {
					if (value && value[fallbackKey]) {
						value = value[fallbackKey];
					} else {
						return key; // Возвращаем ключ, если перевод не найден
					}
				}
				break;
			}
		}
		
		return value || key;
	}
};

class BetterTrashSettingTab extends PluginSettingTab {
	constructor(app, plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();

		// Было: containerEl.createEl('h2', { text: this.plugin.t('settings.title') });
		// Теперь: используем .setHeading() у первого Setting
		new Setting(containerEl)
			.setHeading()
			.setName(this.plugin.t('settings.title'));

		// Переключатель языка (в самом верху)
		new Setting(containerEl)
			.setName(this.plugin.t('settings.language'))
			.setDesc(this.plugin.t('settings.languageDesc'))
			.addDropdown((dropdown) =>
				dropdown
					.addOption('ru', 'Русский')
					.addOption('en', 'English')
					.setValue(this.plugin.settings.language)
					.onChange(async (value) => {
						this.plugin.settings.language = value;
					await this.plugin.saveSettings();
						// Перезагружаем настройки для применения нового языка
						this.display();
				})
			);

		// Сначала выбор папки
		new Setting(containerEl)
			.setName(this.plugin.t('settings.trashFolder'))
			.setDesc(this.plugin.t('settings.trashFolderDesc'))
			.addText((text) => {
				// Инициализируем CSS-класс для поля ввода
				if (this.plugin.settings.trashFolder && this.plugin.settings.trashFolder.trim().length > 0) {
					text.inputEl.classList.add('trash-input-normal');
				} else {
					text.inputEl.classList.add('trash-input-error');
				}
				
				text
					.setPlaceholder('Trash')
					.setValue(this.plugin.settings.trashFolder)
					.onChange(async (value) => {
						const trimmed = value.trim();
						if (trimmed.length === 0) {
							text.inputEl.classList.add('trash-input-error');
							text.inputEl.classList.remove('trash-input-normal');
							return;
						} else {
							text.inputEl.classList.remove('trash-input-error');
							text.inputEl.classList.add('trash-input-normal');
						}
						this.plugin.settings.trashFolder = trimmed;
						await this.plugin.saveSettings();
					});
			});

		// Затем переключатель автоочистки
		const autoDeleteSetting = new Setting(containerEl)
			.setName(this.plugin.t('settings.autoDeleteEnabled'))
			.setDesc(this.plugin.t('settings.autoDeleteEnabledDesc'))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoDeleteEnabled)
					.onChange(async (value) => {
						this.plugin.settings.autoDeleteEnabled = value;
						await this.plugin.saveSettings();
						this.display(); // Перерисовать настройки для скрытия/показа полей
					})
			);

		// Поля времени хранения и интервала — только если автоочистка включена
		if (this.plugin.settings.autoDeleteEnabled) {
			new Setting(containerEl)
				.setName(this.plugin.t('settings.deleteAfterHours'))
				.setDesc(this.plugin.t('settings.deleteAfterHoursDesc'))
				.addText((text) => {
					text
						.setPlaceholder(String(DEFAULT_SETTINGS.deleteAfterHours))
						.setValue(this.plugin.settings.deleteAfterHours !== undefined ? String(this.plugin.settings.deleteAfterHours) : '')
						.onChange(async (value) => {
							const trimmed = value.trim();
							if (trimmed === '' || isNaN(Number(trimmed)) || Number(trimmed) < 1) {
								this.plugin.settings.deleteAfterHours = undefined;
							} else {
								this.plugin.settings.deleteAfterHours = Number(trimmed);
							}
							await this.plugin.saveSettings();
						});
				});

			new Setting(containerEl)
				.setName(this.plugin.t('settings.checkInterval'))
				.setDesc(this.plugin.t('settings.checkIntervalDesc'))
				.addText((text) => {
					text
						.setPlaceholder(String(DEFAULT_SETTINGS.checkIntervalMinutes))
						.setValue(this.plugin.settings.checkIntervalMinutes !== undefined ? String(this.plugin.settings.checkIntervalMinutes) : '')
						.onChange(async (value) => {
							const trimmed = value.trim();
							if (trimmed === '' || isNaN(Number(trimmed)) || Number(trimmed) < 1) {
								this.plugin.settings.checkIntervalMinutes = undefined;
							} else {
								this.plugin.settings.checkIntervalMinutes = Number(trimmed);
							}
							await this.plugin.saveSettings();
						});
				});
		}

		new Setting(containerEl)
			.setName(this.plugin.t('settings.deleteUniqueAttachments'))
			.setDesc(this.plugin.t('settings.deleteUniqueAttachmentsDesc'))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.deleteUniqueAttachments)
					.onChange(async (value) => {
						this.plugin.settings.deleteUniqueAttachments = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(this.plugin.t('settings.deletedAtProperty'))
			.setDesc(this.plugin.t('settings.deletedAtPropertyDesc'))
			.addText((text) => {
				// Инициализируем CSS-класс для поля ввода
				if (this.plugin.settings.deletedAtProperty && this.plugin.settings.deletedAtProperty.trim().length > 0) {
					text.inputEl.classList.add('trash-input-normal');
				} else {
					text.inputEl.classList.add('trash-input-error');
				}
				
				text
					.setPlaceholder('deleted_at')
					.setValue(this.plugin.settings.deletedAtProperty)
					.onChange(async (value) => {
						const trimmed = value.trim();
						if (trimmed.length === 0) {
							text.inputEl.classList.add('trash-input-error');
							text.inputEl.classList.remove('trash-input-normal');
							return;
						} else {
							text.inputEl.classList.remove('trash-input-error');
							text.inputEl.classList.add('trash-input-normal');
						}
						this.plugin.settings.deletedAtProperty = trimmed;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName(this.plugin.t('settings.originalPathProperty'))
			.setDesc(this.plugin.t('settings.originalPathPropertyDesc'))
			.addText((text) => {
				// Инициализируем CSS-класс для поля ввода
				if (this.plugin.settings.originalPathProperty && this.plugin.settings.originalPathProperty.trim().length > 0) {
					text.inputEl.classList.add('trash-input-normal');
				} else {
					text.inputEl.classList.add('trash-input-error');
				}
				
				text
					.setPlaceholder('original_path')
					.setValue(this.plugin.settings.originalPathProperty)
					.onChange(async (value) => {
						const trimmed = value.trim();
						if (trimmed.length === 0) {
							text.inputEl.classList.add('trash-input-error');
							text.inputEl.classList.remove('trash-input-normal');
							return;
						} else {
							text.inputEl.classList.remove('trash-input-error');
							text.inputEl.classList.add('trash-input-normal');
						}
						this.plugin.settings.originalPathProperty = trimmed;
						await this.plugin.saveSettings();
					});
			});

		// Кнопка для ручной проверки корзины
		new Setting(containerEl)
			.setName(this.plugin.t('settings.checkTrashNow'))
			.setDesc(this.plugin.t('settings.checkTrashNowDesc'))
			.addButton((button) =>
				button
					.setButtonText(this.plugin.t('settings.checkTrashButton'))
					.setCta()
					.onClick(async () => {
						button.setButtonText(this.plugin.t('settings.checking'));
						button.setDisabled(true);
						
						try {
							await this.plugin.checkTrashFiles();
							new Notice(this.plugin.t('notices.checkCompleted'));
						} catch (error) {
							new Notice(`${this.plugin.t('notices.checkError')} ${error}`);
						} finally {
							button.setButtonText(this.plugin.t('settings.checkTrashButton'));
							button.setDisabled(false);
						}
					})
			);
	}
}