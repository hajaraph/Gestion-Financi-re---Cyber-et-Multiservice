import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../config/theme.dart';
import '../../models/produit_models.dart';
import '../../services/produit_service.dart';
import '../../widgets/modal_components.dart';

class ProduitFormScreen extends StatefulWidget {
  final Produit? produit;

  const ProduitFormScreen({super.key, this.produit});

  @override
  State<ProduitFormScreen> createState() => _ProduitFormScreenState();
}

class _ProduitFormScreenState extends State<ProduitFormScreen> {
  final _formKey = GlobalKey<FormState>();

  // Contrôleurs
  final _designationController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _prixVenteController = TextEditingController();
  final _quantiteParUniteController = TextEditingController(text: '1');

  // États
  bool _isLoading = false;
  bool _isInitLoading = true;
  String? _error;

  // Listes pour dropdowns
  List<CategorieProduit> _categories = [];
  List<UniteMesure> _unites = [];

  // Valeurs sélectionnées
  int? _selectedCategorieId;
  int? _selectedUniteId;
  int? _selectedUniteAchatId;
  bool _actif = true;

  @override
  void initState() {
    super.initState();
    _loadDependencies();
    if (widget.produit != null) {
      _initForm(widget.produit!);
    }
  }

  void _initForm(Produit produit) {
    _designationController.text = produit.designation;
    _descriptionController.text = produit.description;
    _prixVenteController.text = produit.prixVente.toStringAsFixed(0);
    _actif = produit.actif;
    _selectedCategorieId = produit.categorieId;
    _selectedUniteId = produit.uniteMesureId;
    _selectedUniteAchatId = produit.uniteAchatId;
    _quantiteParUniteController.text = produit.quantiteParUniteAchat
        .toStringAsFixed(0);
  }

  Future<void> _loadDependencies() async {
    setState(() => _isInitLoading = true);

    try {
      final results = await Future.wait([
        produitService.getCategories(),
        produitService.getUnitesMesure(),
      ]);

      final categorieResult = results[0] as CategoriesResult;
      final uniteResult = results[1] as UnitesResult;

      if (mounted) {
        setState(() {
          if (categorieResult.success) _categories = categorieResult.categories;
          if (uniteResult.success) _unites = uniteResult.unites;
          _isInitLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Erreur lors du chargement des données: $e';
          _isInitLoading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _designationController.dispose();
    _descriptionController.dispose();
    _prixVenteController.dispose();
    _quantiteParUniteController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final data = {
      'designation': _designationController.text.trim(),
      'description': _descriptionController.text.trim(),
      'prix_vente': double.tryParse(_prixVenteController.text) ?? 0,
      'categorie': _selectedCategorieId,
      'unite_mesure': _selectedUniteId,
      'unite_achat': _selectedUniteAchatId,
      'quantite_par_unite_achat':
          double.tryParse(_quantiteParUniteController.text) ?? 1.0,
      'actif': _actif,
    };

    ProduitDetailResult result;
    if (widget.produit != null) {
      result = await produitService.updateProduit(widget.produit!.id, data);
    } else {
      result = await produitService.createProduit(data);
    }

    if (!mounted) return;

    setState(() => _isLoading = false);

    if (result.success) {
      Navigator.pop(context, true);
    } else {
      showModernSnackBar(
        context,
        message: result.error ?? 'Une erreur est survenue',
        type: SnackBarType.error,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isInitLoading) {
      return Container(
        height: MediaQuery.of(context).size.height * 0.9,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: const Center(
          child: CircularProgressIndicator(color: AppTheme.primaryBlue),
        ),
      );
    }

    return ModernModal(
      title: widget.produit != null ? 'Modifier Produit' : 'Nouveau Produit',
      onClose: () => Navigator.pop(context),
      footer: SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: _isLoading ? null : _submit,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primaryBlue,
            padding: const EdgeInsets.symmetric(vertical: 16),
            elevation: 4,
            shadowColor: AppTheme.primaryBlue.withValues(alpha: 0.4),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          child: _isLoading
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : Text(
                  'ENREGISTRER',
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
        ),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_error != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 24),
                  decoration: BoxDecoration(
                    color: AppTheme.error.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.error_outline,
                        color: AppTheme.error,
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _error!,
                          style: GoogleFonts.inter(
                            color: AppTheme.error,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

              _buildSectionTitle('Informations Générales'),
              const SizedBox(height: 16),

              ModernTextField(
                controller: _designationController,
                label: 'Désignation',
                hint: 'Ex: Papier A4',
                validator: (v) => v?.isEmpty == true ? 'Requis' : null,
              ),
              const SizedBox(height: 20),

              ModernDropdown<int>(
                label: 'Catégorie',
                value: _selectedCategorieId,
                items: _categories.map((c) {
                  return DropdownMenuItem(value: c.id, child: Text(c.nom));
                }).toList(),
                hint: 'Sélectionner une catégorie',
                onChanged: (v) => setState(() => _selectedCategorieId = v),
              ),
              const SizedBox(height: 20),

              ModernTextField(
                controller: _descriptionController,
                label: 'Description',
                hint: 'Description optionnelle',
                maxLines: 3,
              ),
              const SizedBox(height: 32),

              ModernTextField(
                controller: _prixVenteController,
                label: 'Prix de Vente',
                hint: '0',
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                validator: (v) => v?.isEmpty == true ? 'Requis' : null,
              ),
              const SizedBox(height: 32),

              _buildSectionTitle('Gestion des Unités'),
              const SizedBox(height: 16),

              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Configurez les unités pour les conversions automatiques lors des approvisionnements.',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 20),
                    ModernDropdown<int>(
                      label: 'Unité de Stock (de base) *',
                      value: _selectedUniteId,
                      items: _unites.map((u) {
                        return DropdownMenuItem(
                          value: u.id,
                          child: Text('${u.nom} (${u.symbole})'),
                        );
                      }).toList(),
                      hint: 'Sélectionner l\'unité de base',
                      onChanged: (v) => setState(() => _selectedUniteId = v),
                      validator: (v) => v == null ? 'Requis' : null,
                    ),
                    const SizedBox(height: 20),
                    ModernDropdown<int>(
                      label: 'Unité d\'Achat',
                      value: _selectedUniteAchatId,
                      items: [
                        const DropdownMenuItem<int>(
                          value: null,
                          child: Text('(Aucune)'),
                        ),
                        ..._unites.map((u) {
                          return DropdownMenuItem(
                            value: u.id,
                            child: Text('${u.nom} (${u.symbole})'),
                          );
                        }),
                      ],
                      hint: 'Sélectionner l\'unité d\'achat',
                      onChanged: (v) =>
                          setState(() => _selectedUniteAchatId = v),
                    ),
                    if (_selectedUniteAchatId != null) ...[
                      const SizedBox(height: 20),
                      ModernTextField(
                        controller: _quantiteParUniteController,
                        label: 'Facteur de Conversion',
                        hint: 'Ex: 500',
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                        ],
                        validator: (v) => v?.isEmpty == true ? 'Requis' : null,
                        helperText: _selectedUniteId != null
                            ? 'Combien d\'unités de stock dans 1 unité d\'achat ?'
                            : null,
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 32),

              _buildSectionTitle('État'),
              const SizedBox(height: 16),

              Container(
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: SwitchListTile(
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 4,
                  ),
                  title: Text(
                    'Produit Actif',
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  subtitle: Text(
                    'Visibilité lors de la vente',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  value: _actif,
                  activeThumbColor: AppTheme.success,
                  activeTrackColor: AppTheme.success.withValues(alpha: 0.5),
                  onChanged: (v) => setState(() => _actif = v),
                ),
              ),

              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.outfit(
        fontSize: 17,
        fontWeight: FontWeight.bold,
        color: AppTheme.primaryBlue,
      ),
    );
  }
}
