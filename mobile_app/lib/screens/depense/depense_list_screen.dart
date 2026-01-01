import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../models/depense_models.dart';
import '../../services/depense_service.dart';
import '../../widgets/modal_components.dart';

class DepenseListScreen extends StatefulWidget {
  const DepenseListScreen({super.key});

  @override
  State<DepenseListScreen> createState() => _DepenseListScreenState();
}

class _DepenseListScreenState extends State<DepenseListScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<Depense> _depenses = [];
  bool _isLoading = true;
  String? _error;
  String _searchTerm = '';

  @override
  void initState() {
    super.initState();
    _loadDepenses();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadDepenses() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final result = await depenseService.getDepenses(search: _searchTerm);

    if (mounted) {
      setState(() {
        _isLoading = false;
        if (result.success) {
          _depenses = result.depenses;
        } else {
          _error = result.error;
        }
      });
    }
  }

  void _onSearch(String value) {
    setState(() {
      _searchTerm = value;
    });
    _loadDepenses();
  }

  void _showDepenseForm([Depense? depense]) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) =>
          _DepenseForm(depense: depense, onSuccess: _loadDepenses),
    );
  }

  Future<void> _confirmDelete(Depense depense) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmer la suppression'),
        content: Text(
          'Voulez-vous vraiment supprimer la dépense "${depense.transaction.description}" ?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppTheme.error),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final success = await depenseService.deleteDepense(depense.id);
      if (mounted) {
        if (success) {
          showModernSnackBar(
            context,
            message: 'Dépense supprimée',
            type: SnackBarType.success,
          );
          _loadDepenses();
        } else {
          showModernSnackBar(
            context,
            message: 'Erreur lors de la suppression',
            type: SnackBarType.error,
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: Text(
          'Gestion des Dépenses',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 20),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showDepenseForm(),
        backgroundColor: AppTheme.primaryBlue,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: Column(
        children: [
          // Search Bar
          Container(
            padding: const EdgeInsets.all(16),
            margin: const EdgeInsets.only(bottom: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: AppTheme.cardShadow,
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(24),
                bottomRight: Radius.circular(24),
              ),
            ),
            child: ModernTextField(
              controller: _searchController,
              label: 'Recherche',
              hint: 'Rechercher une dépense...',
              prefixIcon: const Icon(
                Icons.search,
                color: AppTheme.textSecondary,
              ),
              suffixIcon: _searchTerm.isNotEmpty
                  ? IconButton(
                      icon: const Icon(
                        Icons.clear,
                        color: AppTheme.textSecondary,
                      ),
                      onPressed: () {
                        _searchController.clear();
                        _onSearch('');
                      },
                    )
                  : null,
              onChanged: (v) {
                setState(() => _searchTerm = v);
                Future.delayed(const Duration(milliseconds: 500), () {
                  if (mounted && v == _searchController.text) {
                    _loadDepenses();
                  }
                });
              },
              onSubmitted: (v) => _onSearch(v),
            ),
          ),

          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _loadDepenses,
                    child: _depenses.isEmpty
                        ? ListView(
                            children: [
                              SCenter(
                                child: Padding(
                                  padding: const EdgeInsets.only(top: 100),
                                  child: Column(
                                    children: [
                                      Icon(
                                        Icons.money_off,
                                        size: 64,
                                        color: Colors.grey.shade300,
                                      ),
                                      const SizedBox(height: 16),
                                      Text(
                                        _error ?? 'Aucune dépense trouvée',
                                        style: GoogleFonts.inter(
                                          color: AppTheme.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: _depenses.length,
                            separatorBuilder: (_, _) =>
                                const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final d = _depenses[index];
                              return _DepenseCard(
                                depense: d,
                                onEdit: () => _showDepenseForm(d),
                                onDelete: () => _confirmDelete(d),
                              );
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _DepenseCard extends StatelessWidget {
  final Depense depense;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _DepenseCard({
    required this.depense,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final dateStr = DateFormat(
      'dd/MM/yyyy',
    ).format(depense.transaction.dateTransaction);
    final montantStr = NumberFormat.currency(
      symbol: 'Ar',
      decimalDigits: 0,
    ).format(depense.transaction.montant);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        depense.transaction.description,
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        dateStr,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  montantStr,
                  style: GoogleFonts.outfit(
                    fontWeight: FontWeight.w900,
                    fontSize: 18,
                    color: Colors.red.shade600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    depense.categorieDepenseDisplay.toUpperCase(),
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ),
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(
                        Icons.edit_outlined,
                        size: 20,
                        color: AppTheme.primaryBlue,
                      ),
                      onPressed: onEdit,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                    const SizedBox(width: 16),
                    IconButton(
                      icon: const Icon(
                        Icons.delete_outline,
                        size: 20,
                        color: AppTheme.error,
                      ),
                      onPressed: onDelete,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DepenseForm extends StatefulWidget {
  final Depense? depense;
  final VoidCallback onSuccess;

  const _DepenseForm({this.depense, required this.onSuccess});

  @override
  State<_DepenseForm> createState() => _DepenseFormState();
}

class _DepenseFormState extends State<_DepenseForm> {
  final _formKey = GlobalKey<FormState>();
  final _descController = TextEditingController();
  final _montantController = TextEditingController();
  final _fournisseurController = TextEditingController();
  final _factureController = TextEditingController();

  String _selectedCategorie = 'AUTRE';
  List<CategorieDepense> _categories = [];
  bool _loadingCats = true;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    if (widget.depense != null) {
      _descController.text = widget.depense!.transaction.description;
      _montantController.text = widget.depense!.transaction.montant
          .toStringAsFixed(0);
      _fournisseurController.text = widget.depense!.fournisseur ?? '';
      _factureController.text = widget.depense!.numeroFacture ?? '';
      _selectedCategorie = widget.depense!.categorieDepense;
    }
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    final result = await depenseService.getCategories();
    if (mounted) {
      setState(() {
        _loadingCats = false;
        if (result.success) {
          _categories = result.categories;
        }
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);

    final payload = {
      'transaction': {
        'description': _descController.text.trim(),
        'montant': double.tryParse(_montantController.text) ?? 0,
      },
      'categorie_depense': _selectedCategorie,
      'fournisseur': _fournisseurController.text.trim(),
      'numero_facture': _factureController.text.trim(),
    };

    final result = widget.depense != null
        ? await depenseService.updateDepense(widget.depense!.id, payload)
        : await depenseService.createDepense(payload);

    if (mounted) {
      setState(() => _submitting = false);
      if (result.success) {
        Navigator.pop(context);
        showModernSnackBar(
          context,
          message: widget.depense != null
              ? 'Dépense modifiée !'
              : 'Dépense ajoutée !',
          type: SnackBarType.success,
        );
        widget.onSuccess();
      } else {
        showModernSnackBar(
          context,
          message: result.error ?? 'Une erreur est survenue',
          type: SnackBarType.error,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return ModernModal(
      title: widget.depense != null
          ? 'Modifier la Dépense'
          : 'Nouvelle Dépense',
      footer: SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: _submitting ? null : _submit,
          child: _submitting
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : const Text('ENREGISTRER'),
        ),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              ModernTextField(
                controller: _descController,
                label: 'Description *',
                hint: 'Motif de la dépense',
                validator: (v) => (v?.isEmpty ?? true) ? 'Requis' : null,
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: ModernTextField(
                      controller: _montantController,
                      label: 'Montant (Ar) *',
                      hint: '0',
                      keyboardType: TextInputType.number,
                      validator: (v) => (v?.isEmpty ?? true) ? 'Requis' : null,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _loadingCats
                        ? const Center(
                            child: SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                          )
                        : ModernDropdown<String>(
                            label: 'Catégorie *',
                            value: _selectedCategorie,
                            items: _categories.map((c) {
                              return DropdownMenuItem(
                                value: c.value,
                                child: Text(c.label),
                              );
                            }).toList(),
                            hint: 'Sélectionner',
                            onChanged: (v) =>
                                setState(() => _selectedCategorie = v!),
                          ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              ModernTextField(
                controller: _fournisseurController,
                label: 'Fournisseur',
                hint: 'Nom du fournisseur (Optionnel)',
              ),
              const SizedBox(height: 20),
              ModernTextField(
                controller: _factureController,
                label: 'N° Facture',
                hint: 'Référence facture (Optionnel)',
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }
}

class SCenter extends StatelessWidget {
  final Widget child;
  const SCenter({super.key, required this.child});
  @override
  Widget build(BuildContext context) => Center(child: child);
}
